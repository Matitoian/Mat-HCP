<?php
/**
 * Database Sharding Manager - Phase 4
 * Routes queries to appropriate shard based on location
 */

class ShardManager
{
    private $shards = [
        'mombasa' => [
            'host' => $_ENV['DB_SHARD_MOMBASA_HOST'] ?? 'db-mombasa',
            'port' => $_ENV['DB_SHARD_MOMBASA_PORT'] ?? 5432,
            'db' => 'housecom_mombasa'
        ],
        'kilifi' => [
            'host' => $_ENV['DB_SHARD_KILIFI_HOST'] ?? 'db-kilifi',
            'port' => $_ENV['DB_SHARD_KILIFI_PORT'] ?? 5432,
            'db' => 'housecom_kilifi'
        ],
        'kwale' => [
            'host' => $_ENV['DB_SHARD_KWALE_HOST'] ?? 'db-kwale',
            'port' => $_ENV['DB_SHARD_KWALE_PORT'] ?? 5432,
            'db' => 'housecom_kwale'
        ],
        'lamu' => [
            'host' => $_ENV['DB_SHARD_LAMU_HOST'] ?? 'db-lamu',
            'port' => $_ENV['DB_SHARD_LAMU_PORT'] ?? 5432,
            'db' => 'housecom_lamu'
        ]
    ];

    private $connections = [];

    /**
     * Determine shard from coordinates
     */
    public function getShardByCoordinates($latitude, $longitude)
    {
        // Coastal Kenya geo-boundaries (simplified)
        $regions = [
            'mombasa' => [
                'min_lat' => -4.8, 'max_lat' => -4.0,
                'min_lon' => 39.3, 'max_lon' => 39.9
            ],
            'kilifi' => [
                'min_lat' => -4.0, 'max_lat' => -3.2,
                'min_lon' => 39.5, 'max_lon' => 40.2
            ],
            'kwale' => [
                'min_lat' => -4.8, 'max_lat' => -4.2,
                'min_lon' => 39.0, 'max_lon' => 39.5
            ],
            'lamu' => [
                'min_lat' => -2.3, 'max_lat' => -1.8,
                'min_lon' => 40.8, 'max_lon' => 41.5
            ]
        ];

        foreach ($regions as $shard => $bounds) {
            if ($latitude >= $bounds['min_lat'] && $latitude <= $bounds['max_lat'] &&
                $longitude >= $bounds['min_lon'] && $longitude <= $bounds['max_lon']) {
                return $shard;
            }
        }

        // Default to Mombasa
        return 'mombasa';
    }

    /**
     * Get shard connection
     */
    public function getConnection($shard = null, $latitude = null, $longitude = null)
    {
        // Auto-determine shard if coordinates provided
        if ($latitude !== null && $longitude !== null) {
            $shard = $this->getShardByCoordinates($latitude, $longitude);
        }

        if (!isset($this->shards[$shard])) {
            throw new Exception("Unknown shard: $shard");
        }

        // Cache connections
        if (!isset($this->connections[$shard])) {
            $config = $this->shards[$shard];
            $dsn = "pgsql:host={$config['host']};port={$config['port']};dbname={$config['db']}";

            try {
                $this->connections[$shard] = new PDO(
                    $dsn,
                    $_ENV['DB_USER'],
                    $_ENV['DB_PASSWORD'],
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]
                );
            } catch (PDOException $e) {
                throw new Exception("Failed to connect to shard $shard: " . $e->getMessage());
            }
        }

        return $this->connections[$shard];
    }

    /**
     * Query single shard
     */
    public function queryAtShard($shard, $query, $params = [])
    {
        $conn = $this->getConnection($shard);
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Query across multiple shards (scatter-gather)
     */
    public function queryAcrossShards($query, $params = [], $shards = null)
    {
        $shardsToQuery = $shards ?? array_keys($this->shards);
        $results = [];

        foreach ($shardsToQuery as $shard) {
            try {
                $conn = $this->getConnection($shard);
                $stmt = $conn->prepare($query);
                $stmt->execute($params);
                $results[$shard] = $stmt->fetchAll();
            } catch (Exception $e) {
                error_log("Error querying shard $shard: " . $e->getMessage());
                $results[$shard] = [];
            }
        }

        return $results;
    }

    /**
     * Insert property at shard
     */
    public function insertProperty($property)
    {
        $shard = $this->getShardByCoordinates($property['latitude'], $property['longitude']);
        $conn = $this->getConnection($shard);

        $query = "
            INSERT INTO properties 
            (user_id, title, description, county, price, bedrooms, bathrooms, latitude, longitude, verified, created_at)
            VALUES 
            (:user_id, :title, :description, :county, :price, :bedrooms, :bathrooms, :latitude, :longitude, :verified, NOW())
            RETURNING id
        ";

        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':user_id' => $property['user_id'],
            ':title' => $property['title'],
            ':description' => $property['description'],
            ':county' => $property['county'],
            ':price' => $property['price'],
            ':bedrooms' => $property['bedrooms'],
            ':bathrooms' => $property['bathrooms'],
            ':latitude' => $property['latitude'],
            ':longitude' => $property['longitude'],
            ':verified' => $property['verified'] ?? false
        ]);

        $result = $stmt->fetch();
        return [
            'id' => $result['id'],
            'shard' => $shard
        ];
    }

    /**
     * Search properties geo-spatially
     */
    public function searchNearby($latitude, $longitude, $radius_km = 5, $limit = 20)
    {
        $query = "
            SELECT id, title, price, bedrooms, latitude, longitude,
                   ROUND(
                       (6371 * acos(
                           cos(radians(:lat)) * cos(radians(latitude)) *
                           cos(radians(longitude) - radians(:lon)) +
                           sin(radians(:lat)) * sin(radians(latitude))
                       ))::numeric, 2
                   ) as distance_km
            FROM properties
            WHERE verified = true
                AND (6371 * acos(
                    cos(radians(:lat)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians(:lon)) +
                    sin(radians(:lat)) * sin(radians(latitude))
                )) <= :radius
            ORDER BY distance_km ASC
            LIMIT :limit
        ";

        $shard = $this->getShardByCoordinates($latitude, $longitude);
        $conn = $this->getConnection($shard);
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':lat' => $latitude,
            ':lon' => $longitude,
            ':radius' => $radius_km,
            ':limit' => $limit
        ]);

        return $stmt->fetchAll();
    }

    /**
     * Migrate property between shards (for location change)
     */
    public function migrateProperty($propertyId, $oldShard, $newShard, $propertyData)
    {
        try {
            // Start transactions
            $oldConn = $this->getConnection($oldShard);
            $newConn = $this->getConnection($newShard);

            $oldConn->beginTransaction();
            $newConn->beginTransaction();

            // Copy to new shard
            $query = "
                INSERT INTO properties 
                (id, user_id, title, description, county, price, bedrooms, bathrooms, latitude, longitude, verified, created_at)
                VALUES 
                (:id, :user_id, :title, :description, :county, :price, :bedrooms, :bathrooms, :latitude, :longitude, :verified, :created_at)
            ";

            $stmt = $newConn->prepare($query);
            $stmt->execute($propertyData + ['id' => $propertyId]);

            // Delete from old shard
            $oldStmt = $oldConn->prepare("DELETE FROM properties WHERE id = :id");
            $oldStmt->execute([':id' => $propertyId]);

            // Commit both transactions
            $oldConn->commit();
            $newConn->commit();

            return ['success' => true, 'new_shard' => $newShard];
        } catch (Exception $e) {
            $oldConn->rollBack();
            $newConn->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get shard statistics
     */
    public function getShardStats()
    {
        $stats = [];

        foreach (array_keys($this->shards) as $shard) {
            try {
                $conn = $this->getConnection($shard);
                $stmt = $conn->query("
                    SELECT 
                        COUNT(*) as total_properties,
                        COUNT(CASE WHEN verified = true THEN 1 END) as verified_properties,
                        AVG(price) as avg_price,
                        SUM(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as properties_24h
                    FROM properties
                ");
                $stats[$shard] = $stmt->fetch();
            } catch (Exception $e) {
                $stats[$shard] = ['error' => $e->getMessage()];
            }
        }

        return $stats;
    }

    /**
     * Replica lag monitoring
     */
    public function monitorReplication()
    {
        $status = [];

        foreach (array_keys($this->shards) as $shard) {
            try {
                $conn = $this->getConnection($shard);
                $stmt = $conn->query("
                    SELECT 
                        EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp()))::int as lag_seconds,
                        COALESCE(pg_is_in_recovery(), false) as is_replica
                    FROM pg_database WHERE datname = current_database()
                ");
                $status[$shard] = $stmt->fetch();
            } catch (Exception $e) {
                $status[$shard] = ['error' => $e->getMessage()];
            }
        }

        return $status;
    }
}
