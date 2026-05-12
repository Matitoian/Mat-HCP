<?php
/**
 * Search Indexing Worker - Phase 3/4: Elasticsearch Integration
 * Indexes properties into Elasticsearch for full-text search
 * 
 * Run as: php backend/workers/SearchIndexWorker.php &
 */

require_once __DIR__ . '/../config/config.php';

class SearchIndexWorker
{
    private $queueFile;
    private $esHost;
    private $esPort;
    private $logger;

    public function __construct()
    {
        $this->queueFile = '/tmp/housecom_search_queue.json';
        $this->esHost = $_ENV['ELASTICSEARCH_HOST'] ?? 'localhost';
        $this->esPort = $_ENV['ELASTICSEARCH_PORT'] ?? 9200;
        $this->logger = fopen('/var/log/housecom/search_worker.log', 'a');

        if (!$this->logger) {
            $this->logger = STDOUT;
        }

        $this->log("Search Indexing Worker started");
        $this->log("Elasticsearch: {$this->esHost}:{$this->esPort}");
    }

    public function start()
    {
        while (true) {
            try {
                $this->processQueue();
                sleep(2); // Process queue every 2 seconds
            } catch (Exception $e) {
                $this->log("Error: " . $e->getMessage());
                sleep(5);
            }
        }
    }

    private function processQueue()
    {
        if (file_exists($this->queueFile)) {
            $queue = json_decode(file_get_contents($this->queueFile), true) ?? [];

            if (!empty($queue)) {
                $indexRequest = array_shift($queue);
                $this->handleIndexRequest($indexRequest);
                file_put_contents($this->queueFile, json_encode($queue));
            }
        }
    }

    private function handleIndexRequest($request)
    {
        try {
            $this->log("Processing index request: " . $request['action']);

            switch ($request['action'] ?? null) {
                case 'index_property':
                    $this->indexProperty($request['property']);
                    break;

                case 'update_property':
                    $this->indexProperty($request['property']);
                    break;

                case 'delete_property':
                    $this->deleteProperty($request['property_id']);
                    break;

                case 'bulk_index':
                    $this->bulkIndex($request['properties']);
                    break;

                default:
                    $this->log("Unknown action: {$request['action']}");
            }

        } catch (Exception $e) {
            $this->log("Error handling index request: " . $e->getMessage());
        }
    }

    private function indexProperty($property)
    {
        $indexName = 'properties_' . date('Y-m');
        $propertyId = $property['id'] ?? null;

        if (!$propertyId) {
            $this->log("Property missing ID");
            return;
        }

        $doc = [
            'property_id' => $propertyId,
            'title' => $property['title'] ?? '',
            'description' => $property['description'] ?? '',
            'county' => $property['county'] ?? '',
            'location' => [
                'lat' => (float)($property['latitude'] ?? 0),
                'lon' => (float)($property['longitude'] ?? 0)
            ],
            'price' => (int)($property['price'] ?? 0),
            'bedrooms' => (int)($property['bedrooms'] ?? 0),
            'bathrooms' => (int)($property['bathrooms'] ?? 0),
            'property_type' => $property['type'] ?? 'apartment',
            'verified' => (bool)($property['verified'] ?? false),
            'rating' => (float)($property['rating'] ?? 0),
            'review_count' => (int)($property['review_count'] ?? 0),
            'landlord_name' => $property['landlord_name'] ?? '',
            'image_url' => $property['image_url'] ?? '',
            'amenities' => $property['amenities'] ?? [],
            'indexed_at' => date('c'),
            'updated_at' => date('c')
        ];

        $response = $this->elasticsearchRequest(
            "PUT",
            "/$indexName/_doc/$propertyId",
            $doc
        );

        if ($response['success']) {
            $this->log("Property indexed: $propertyId");
        } else {
            $this->log("Failed to index property: " . ($response['error'] ?? 'Unknown'));
        }
    }

    private function deleteProperty($propertyId)
    {
        $indexName = 'properties_' . date('Y-m');

        $response = $this->elasticsearchRequest(
            "DELETE",
            "/$indexName/_doc/$propertyId"
        );

        if ($response['success']) {
            $this->log("Property deleted from index: $propertyId");
        } else {
            $this->log("Failed to delete property: $propertyId");
        }
    }

    private function bulkIndex($properties)
    {
        $bulk = '';

        foreach ($properties as $property) {
            $propertyId = $property['id'] ?? null;
            if (!$propertyId) continue;

            $indexName = 'properties_' . date('Y-m');

            // Bulk format: action\ndata\n
            $bulk .= json_encode(['index' => ['_index' => $indexName, '_id' => $propertyId]]) . "\n";
            $bulk .= json_encode([
                'title' => $property['title'] ?? '',
                'description' => $property['description'] ?? '',
                'county' => $property['county'] ?? '',
                'price' => (int)($property['price'] ?? 0),
                'bedrooms' => (int)($property['bedrooms'] ?? 0),
                'verified' => (bool)($property['verified'] ?? false),
                'indexed_at' => date('c')
            ]) . "\n";
        }

        if (empty($bulk)) {
            $this->log("No properties to bulk index");
            return;
        }

        $response = $this->elasticsearchRequest(
            "POST",
            "/_bulk",
            $bulk,
            true // Raw body
        );

        $this->log("Bulk indexed " . count($properties) . " properties");
    }

    private function elasticsearchRequest($method, $endpoint, $data = null, $rawBody = false)
    {
        $url = "http://{$this->esHost}:{$this->esPort}{$endpoint}";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $headers = ['Content-Type: application/json'];
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        if ($data !== null) {
            $body = $rawBody ? $data : json_encode($data);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return ['success' => false, 'error' => $error];
        }

        if ($statusCode >= 400) {
            return ['success' => false, 'error' => "HTTP $statusCode", 'response' => $response];
        }

        return ['success' => true, 'response' => json_decode($response, true)];
    }

    private function log($message)
    {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] [SearchIndexWorker] $message\n";
        fwrite($this->logger, $logMessage);
        fflush($this->logger);
        echo $logMessage;
    }

    public function __destruct()
    {
        if ($this->logger && $this->logger !== STDOUT) {
            fclose($this->logger);
        }
    }
}

pcntl_signal(SIGTERM, function () {
    global $worker;
    $worker->log("Shutting down");
    exit(0);
});

$worker = new SearchIndexWorker();
$worker->start();
