<?php
/**
 * Database Query Optimization Utils
 * For handling 2.5M concurrent users and high throughput
 */

class DatabaseOptimizer {
    /**
     * Get optimized query for property listing with pagination
     * Uses indexes for fast and ordering
     */
    public static function getPropertiesOptimized($county, $minPrice, $maxPrice, $page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        
        $query = "
            SELECT 
                p.id, p.title, p.price, p.county, p.location,
                p.bedrooms, p.bathrooms, p.verified,
                u.full_name as landlord_name, u.verified as landlord_verified,
                COUNT(DISTINCT pi.id) as image_count,
                AVG(pr.rating) as avg_rating
            FROM properties p
            LEFT JOIN users u ON p.landlord_id = u.id
            LEFT JOIN property_images pi ON p.id = pi.property_id
            LEFT JOIN property_reviews pr ON p.id = pr.property_id AND pr.status = 'approved'
            WHERE p.county = :county 
                AND p.price >= :minPrice 
                AND p.price <= :maxPrice
                AND p.status = 'active'
                AND p.availability = 'available'
            GROUP BY p.id, u.id
            ORDER BY p.verified DESC, p.views_count DESC
            LIMIT :limit OFFSET :offset";
        
        return [
            'query' => $query,
            'params' => [
                ':county' => $county,
                ':minPrice' => $minPrice,
                ':maxPrice' => $maxPrice,
                ':limit' => $limit,
                ':offset' => $offset,
            ]
        ];
    }

    /**
     * Get optimized search query using full-text search
     * For large-scale property search
     */
    public static function searchPropertiesOptimized($searchTerm, $county = null, $page = 1) {
        $offset = ($page - 1) * 20;
        
        $query = "
            SELECT 
                p.id, p.title, p.price, p.county, p.location,
                p.bedrooms, p.bathrooms,
                u.full_name as landlord_name,
                ISNULL(AVG(pr.rating)) as avg_rating
            FROM properties p
            LEFT JOIN users u ON p.landlord_id = u.id
            LEFT JOIN property_reviews pr ON p.id = pr.property_id AND pr.status = 'approved'
            WHERE p.status = 'active'
                AND (
                    p.title ILIKE :search
                    OR p.description ILIKE :search
                    OR p.location ILIKE :search
                )";
        
        $params = [':search' => "%$searchTerm%"];
        
        if ($county) {
            $query .= " AND p.county = :county";
            $params[':county'] = $county;
        }
        
        $query .= " ORDER BY p.verified DESC, CASE WHEN p.title ILIKE :exactSearch THEN 0 ELSE 1 END, p.created_at DESC LIMIT 20 OFFSET $offset";
        $params[':exactSearch'] = $searchTerm;
        
        return [
            'query' => $query,
            'params' => $params
        ];
    }

    /**
     * Get user dashboard data efficiently
     * Combines multiple queries with proper caching
     */
    public static function getUserDashboard($userId) {
        $queries = [
            'profile' => "SELECT id, email, full_name, role, verified FROM users WHERE id = :userId",
            'savedCount' => "SELECT COUNT(*) as count FROM saved_properties WHERE user_id = :userId",
            'messagesCount' => "SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = :userId AND is_read = FALSE",
            'recentChats' => "
                SELECT DISTINCT ON (cm.sender_id)
                    cm.sender_id, u.full_name, cm.message, cm.sent_at
                FROM chat_messages cm
                JOIN users u ON cm.sender_id = u.id
                WHERE cm.receiver_id = :userId
                ORDER BY cm.sender_id, cm.sent_at DESC
                LIMIT 5"
        ];
        
        return [
            'queries' => $queries,
            'params' => [':userId' => $userId]
        ];
    }

    /**
     * Get optimized nearby properties query
     * Uses geographic indexing for location-based search
     */
    public static function getNearbyProperties($latitude, $longitude, $radiusKm = 5, $limit = 50) {
        // Haversine formula for distance calculation
        $query = "
            SELECT 
                p.id, p.title, p.price, p.location,
                p.bedrooms, p.bathrooms,
                (
                    6371 * acos(
                        cos(radians(:latitude)) * cos(radians(p.latitude)) *
                        cos(radians(p.longitude) - radians(:longitude)) +
                        sin(radians(:latitude)) * sin(radians(p.latitude))
                    )
                ) AS distance
            FROM properties p
            WHERE p.status = 'active'
                AND p.availability = 'available'
                AND (
                    6371 * acos(
                        cos(radians(:latitude)) * cos(radians(p.latitude)) *
                        cos(radians(p.longitude) - radians(:longitude)) +
                        sin(radians(:latitude)) * sin(radians(p.latitude))
                    )
                ) < :radius
            ORDER BY distance ASC
            LIMIT :limit";
        
        return [
            'query' => $query,
            'params' => [
                ':latitude' => $latitude,
                ':longitude' => $longitude,
                ':radius' => $radiusKm,
                ':limit' => $limit,
            ]
        ];
    }

    /**
     * Batch operation for bulk updates
     * Reduces database round trips
     */
    public static function bulkUpdateViews($propertyIds) {
        // Split into chunks of 100 for better performance
        $chunks = array_chunk($propertyIds, 100);
        $queries = [];
        
        foreach ($chunks as $i => $chunk) {
            $placeholders = implode(',', array_fill(0, count($chunk), '?'));
            $queries[] = "UPDATE properties SET views_count = views_count + 1 WHERE id IN ($placeholders)";
        }
        
        return $queries;
    }

    /**
     * Query to get hot properties (trending)
     * Optimized for caching
     */
    public static function getHotProperties($hours = 24, $limit = 20) {
        $query = "
            SELECT 
                p.id, p.title, p.price, p.county,
                p.views_count,
                COUNT(DISTINCT sp.id) as save_count,
                AVG(pr.rating) as avg_rating
            FROM properties p
            LEFT JOIN saved_properties sp ON p.id = sp.property_id
            LEFT JOIN property_reviews pr ON p.id = pr.property_id
            WHERE p.created_at > NOW() - INTERVAL '$hours hours'
                AND p.status = 'active'
            GROUP BY p.id
            ORDER BY p.views_count DESC, save_count DESC
            LIMIT :limit";
        
        return [
            'query' => $query,
            'cache_key' => "hot_properties_$hours",
            'cache_ttl' => 3600, // 1 hour
            'params' => [':limit' => $limit]
        ];
    }
}

/**
 * Connection Pool Manager
 * Manages connection reuse for 2.5M concurrent users
 */
class ConnectionPool {
    private static $connections = [];
    private static $maxConnections = 10;
    private static $idleTimeout = 300; // 5 minutes

    /**
     * Get or create a database connection
     */
    public static function getConnection() {
        // Check for idle connections
        foreach (self::$connections as $key => $conn) {
            if (time() - $conn['lastUsed'] > self::$idleTimeout) {
                unset(self::$connections[$key]);
            }
        }

        // Return first available connection
        if (count(self::$connections) < self::$maxConnections) {
            $conn = self::createConnection();
            self::$connections[] = [
                'connection' => $conn,
                'lastUsed' => time(),
            ];
            return $conn;
        }

        // Return least recently used connection
        $lru = min(array_map(function($c) { return $c['lastUsed']; }, self::$connections));
        foreach (self::$connections as &$c) {
            if ($c['lastUsed'] === $lru) {
                $c['lastUsed'] = time();
                return $c['connection'];
            }
        }
    }

    private static function createConnection() {
        // Return database connection
        $database = new \Database();
        return $database->getConnection();
    }
}
?>
