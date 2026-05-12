<?php
/**
 * Elasticsearch Search Integration - Phase 4
 * Full-text search with geo-spatial queries
 */

class ElasticsearchClient
{
    private $host;
    private $port;
    private $indexPrefix = 'properties_';

    public function __construct($host = 'localhost', $port = 9200)
    {
        $this->host = $_ENV['ELASTICSEARCH_HOST'] ?? $host;
        $this->port = $_ENV['ELASTICSEARCH_PORT'] ?? $port;
    }

    /**
     * Create or update a property index
     */
    public function createIndex($indexName = null)
    {
        $indexName = $indexName ?? $this->indexPrefix . date('Y-m');

        $mapping = [
            'settings' => [
                'number_of_shards' => 5,
                'number_of_replicas' => 1,
                'analysis' => [
                    'analyzer' => [
                        'property_analyzer' => [
                            'type' => 'standard',
                            'stopwords' => '_english_'
                        ]
                    ]
                ]
            ],
            'mappings' => [
                'properties' => [
                    'property_id' => ['type' => 'keyword'],
                    'title' => [
                        'type' => 'text',
                        'analyzer' => 'property_analyzer',
                        'fields' => ['keyword' => ['type' => 'keyword']]
                    ],
                    'description' => [
                        'type' => 'text',
                        'analyzer' => 'property_analyzer'
                    ],
                    'county' => ['type' => 'keyword'],
                    'property_type' => ['type' => 'keyword'],
                    'location' => [
                        'type' => 'geo_point'
                    ],
                    'price' => ['type' => 'integer'],
                    'bedrooms' => ['type' => 'integer'],
                    'bathrooms' => ['type' => 'integer'],
                    'verified' => ['type' => 'boolean'],
                    'rating' => ['type' => 'float'],
                    'amenities' => ['type' => 'keyword'],
                    'indexed_at' => ['type' => 'date'],
                    'updated_at' => ['type' => 'date']
                ]
            ]
        ];

        return $this->request('PUT', "/$indexName", $mapping);
    }

    /**
     * Complex search with all possible filters
     */
    public function search($query, $filters = [])
    {
        $indexName = $this->indexPrefix . '*';

        $body = [
            'query' => [
                'bool' => [
                    'must' => [
                        [
                            'multi_match' => [
                                'query' => $query,
                                'fields' => ['title^3', 'description^2', 'county'],
                                'operator' => 'or'
                            ]
                        ]
                    ],
                    'filter' => []
                ]
            ],
            'sort' => [
                ['_score' => ['order' => 'desc']],
                ['updated_at' => ['order' => 'desc']]
            ],
            'aggs' => [
                'counties' => [
                    'terms' => ['field' => 'county', 'size' => 10]
                ],
                'price_ranges' => [
                    'range' => [
                        'field' => 'price',
                        'ranges' => [
                            ['to' => 10000],
                            ['from' => 10000, 'to' => 25000],
                            ['from' => 25000, 'to' => 50000],
                            ['from' => 50000]
                        ]
                    ]
                ],
                'bedrooms' => [
                    'terms' => ['field' => 'bedrooms', 'size' => 10]
                ]
            ],
            'from' => $filters['from'] ?? 0,
            'size' => $filters['size'] ?? 20
        ];

        // Add filters to query
        if (!empty($filters['county'])) {
            $body['query']['bool']['filter'][] = ['term' => ['county' => $filters['county']]];
        }

        if (!empty($filters['price_min'])) {
            $body['query']['bool']['filter'][] = ['range' => ['price' => ['gte' => $filters['price_min']]]];
        }

        if (!empty($filters['price_max'])) {
            $body['query']['bool']['filter'][] = ['range' => ['price' => ['lte' => $filters['price_max']]]];
        }

        if (!empty($filters['bedrooms'])) {
            $body['query']['bool']['filter'][] = ['term' => ['bedrooms' => $filters['bedrooms']]];
        }

        if (!empty($filters['property_type'])) {
            $body['query']['bool']['filter'][] = ['term' => ['property_type' => $filters['property_type']]];
        }

        if (!empty($filters['verified'])) {
            $body['query']['bool']['filter'][] = ['term' => ['verified' => true]];
        }

        // Geo-spatial search (within radius)
        if (!empty($filters['location']) && is_array($filters['location'])) {
            $body['query']['bool']['filter'][] = [
                'geo_distance' => [
                    'distance' => $filters['distance'] ?? '5km',
                    'location' => [
                        'lat' => $filters['location']['lat'],
                        'lon' => $filters['location']['lon']
                    ]
                ]
            ];
        }

        return $this->request('GET', "/$indexName/_search", $body);
    }

    /**
     * Index a single property
     */
    public function indexProperty($property)
    {
        $indexName = $this->indexPrefix . date('Y-m');
        $propertyId = $property['id'];

        $doc = [
            'property_id' => $propertyId,
            'title' => $property['title'],
            'description' => $property['description'],
            'county' => $property['county'],
            'property_type' => $property['type'] ?? 'apartment',
            'location' => [
                'lat' => (float)$property['latitude'],
                'lon' => (float)$property['longitude']
            ],
            'price' => (int)$property['price'],
            'bedrooms' => (int)$property['bedrooms'],
            'bathrooms' => (int)$property['bathrooms'],
            'verified' => (bool)$property['verified'],
            'rating' => (float)($property['rating'] ?? 0),
            'amenities' => $property['amenities'] ?? [],
            'indexed_at' => date('c'),
            'updated_at' => date('c')
        ];

        return $this->request('PUT', "/$indexName/_doc/$propertyId", $doc);
    }

    /**
     * Bulk index multiple properties
     */
    public function bulkIndex($properties)
    {
        $indexName = $this->indexPrefix . date('Y-m');
        $bulk = '';

        foreach ($properties as $property) {
            $propertyId = $property['id'];

            // Bulk format: action metadata\ndocument\n
            $bulk .= json_encode(['index' => ['_index' => $indexName, '_id' => $propertyId]]) . "\n";

            $doc = [
                'title' => $property['title'],
                'description' => $property['description'],
                'county' => $property['county'],
                'location' => [
                    'lat' => (float)$property['latitude'],
                    'lon' => (float)$property['longitude']
                ],
                'price' => (int)$property['price'],
                'bedrooms' => (int)$property['bedrooms'],
                'verified' => (bool)$property['verified'],
                'indexed_at' => date('c')
            ];

            $bulk .= json_encode($doc) . "\n";
        }

        return $this->request('POST', '/_bulk', $bulk, true);
    }

    /**
     * HTTP request to Elasticsearch
     */
    private function request($method, $endpoint, $body = null, $rawBody = false)
    {
        $url = "http://{$this->host}:{$this->port}{$endpoint}";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

        if ($body !== null) {
            $bodyStr = $rawBody ? $body : json_encode($body);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyStr);
        }

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return ['success' => false, 'error' => $error];
        }

        if ($statusCode >= 400) {
            return [
                'success' => false,
                'status_code' => $statusCode,
                'error' => $response
            ];
        }

        return ['success' => true, 'data' => json_decode($response, true)];
    }

    /**
     * Get cluster health
     */
    public function health()
    {
        return $this->request('GET', '/_cluster/health');
    }

    /**
     * List all indices
     */
    public function listIndices()
    {
        return $this->request('GET', '/_cat/indices?format=json');
    }
}
