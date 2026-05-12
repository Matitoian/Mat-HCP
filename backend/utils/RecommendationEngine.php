<?php
/**
 * ML Recommendation Engine - Phase 4
 * Personalized property suggestions using collaborative filtering
 */

class RecommendationEngine
{
    private $pythonServiceUrl = 'http://localhost:5000';
    private $cacheManager;

    public function __construct()
    {
        $this->cacheManager = new CacheManager();
    }

    /**
     * Get personalized recommendations for user
     */
    public function getRecommendations($userId, $limit = 10)
    {
        // Check cache first (valid for 24 hours)
        $cacheKey = "recommendations_user_{$userId}";
        $cached = $this->cacheManager->get($cacheKey);
        if ($cached) {
            return [
                'source' => 'cache',
                'recommendations' => json_decode($cached, true)
            ];
        }

        try {
            // Call Python ML service
            $recommendations = $this->callPythonService('recommendations', [
                'user_id' => $userId,
                'limit' => $limit
            ]);

            // Cache results
            $this->cacheManager->set($cacheKey, json_encode($recommendations), 86400);

            return [
                'source' => 'ml_model',
                'recommendations' => $recommendations
            ];
        } catch (Exception $e) {
            error_log("ML recommendation error: " . $e->getMessage());
            // Fallback to popularity-based recommendations
            return $this->getFallbackRecommendations($userId, $limit);
        }
    }

    /**
     * Get trending properties
     */
    public function getTrending($county = null, $limit = 10)
    {
        $cacheKey = 'trending_' . ($county ?? 'all');
        $cached = $this->cacheManager->get($cacheKey);
        if ($cached) {
            return json_decode($cached, true);
        }

        try {
            $trending = $this->callPythonService('trending', [
                'county' => $county,
                'limit' => $limit
            ]);

            $this->cacheManager->set($cacheKey, json_encode($trending), 3600);
            return $trending;
        } catch (Exception $e) {
            return $this->getFallbackTrending($county, $limit);
        }
    }

    /**
     * Get similar properties
     */
    public function getSimilarProperties($propertyId, $limit = 5)
    {
        $cacheKey = "similar_properties_{$propertyId}";
        $cached = $this->cacheManager->get($cacheKey);
        if ($cached) {
            return json_decode($cached, true);
        }

        try {
            $similar = $this->callPythonService('similar', [
                'property_id' => $propertyId,
                'limit' => $limit
            ]);

            $this->cacheManager->set($cacheKey, json_encode($similar), 86400);
            return $similar;
        } catch (Exception $e) {
            return $this->getFallbackSimilar($propertyId, $limit);
        }
    }

    /**
     * Track user interaction for model training
     */
    public function trackInteraction($userId, $propertyId, $action)
    {
        // Actions: view, click, favorite, inquire, lease
        try {
            $db = Database::getInstance();
            $query = "
                INSERT INTO user_interactions 
                (user_id, property_id, action, created_at)
                VALUES (?, ?, ?, NOW())
            ";
            $stmt = $db->prepare($query);
            $stmt->execute([$userId, $propertyId, $action]);

            // Invalidate recommendation cache
            $this->cacheManager->delete("recommendations_user_{$userId}");

            return ['success' => true];
        } catch (Exception $e) {
            error_log("Interaction tracking error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Retrain ML model with latest data
     */
    public function retrainModel()
    {
        try {
            return $this->callPythonService('retrain', [], 'POST');
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Call Python ML service
     */
    private function callPythonService($endpoint, $params = [], $method = 'GET')
    {
        $url = $this->pythonServiceUrl . '/api/' . $endpoint;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        } else {
            curl_setopt($ch, CURLOPT_URL, $url . '?' . http_build_query($params));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("ML service error: $error");
        }

        if ($httpCode >= 400) {
            throw new Exception("ML service returned HTTP $httpCode");
        }

        return json_decode($response, true);
    }

    /**
     * Fallback: popularity-based recommendations
     */
    private function getFallbackRecommendations($userId, $limit)
    {
        try {
            $db = Database::getInstance();

            // Get user's search history
            $historyQuery = "
                SELECT DISTINCT county 
                FROM user_interactions 
                WHERE user_id = ? AND action IN ('view', 'click', 'favorite')
                LIMIT 3
            ";
            $stmt = $db->prepare($historyQuery);
            $stmt->execute([$userId]);
            $counties = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (empty($counties)) {
                $counties = ['Mombasa']; // Default county
            }

            // Get popular properties in those counties
            $placeholders = implode(',', array_fill(0, count($counties), '?'));
            $query = "
                SELECT p.*, 
                       COUNT(ui.id) as view_count,
                       AVG(pr.rating) as avg_rating
                FROM properties p
                LEFT JOIN user_interactions ui ON p.id = ui.property_id AND ui.action IN ('view', 'click')
                LEFT JOIN property_reviews pr ON p.id = pr.property_id
                WHERE p.verified = true AND p.county IN ($placeholders)
                GROUP BY p.id
                ORDER BY view_count DESC, avg_rating DESC
                LIMIT ?
            ";

            $stmt = $db->prepare($query);
            $params = array_merge($counties, [$limit]);
            $stmt->execute($params);

            return $stmt->fetchAll();
        } catch (Exception $e) {
            error_log("Fallback recommendations error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Fallback: trending properties by view count
     */
    private function getFallbackTrending($county, $limit)
    {
        try {
            $db = Database::getInstance();

            $query = "
                SELECT p.*, 
                       COUNT(ui.id) as view_count,
                       AVG(pr.rating) as avg_rating
                FROM properties p
                LEFT JOIN user_interactions ui ON p.id = ui.property_id AND ui.action IN ('view', 'click')
                LEFT JOIN property_reviews pr ON p.id = pr.property_id
                WHERE p.verified = true
            ";

            $params = [];
            if ($county) {
                $query .= " AND p.county = ?";
                $params[] = $county;
            }

            $query .= "
                GROUP BY p.id
                HAVING COUNT(ui.id) > 0
                ORDER BY view_count DESC
                LIMIT ?
            ";
            $params[] = $limit;

            $stmt = $db->prepare($query);
            $stmt->execute($params);

            return $stmt->fetchAll();
        } catch (Exception $e) {
            error_log("Fallback trending error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Fallback: similar properties by attributes
     */
    private function getFallbackSimilar($propertyId, $limit)
    {
        try {
            $db = Database::getInstance();

            // Get property details
            $propQuery = "SELECT * FROM properties WHERE id = ?";
            $propStmt = $db->prepare($propQuery);
            $propStmt->execute([$propertyId]);
            $property = $propStmt->fetch();

            if (!$property) {
                return [];
            }

            // Find similar properties (same county, similar price and bedrooms)
            $priceRange = $property['price'] * 0.2; // 20% tolerance
            $query = "
                SELECT * FROM properties
                WHERE id != ?
                AND county = ?
                AND price BETWEEN ? AND ?
                AND bedrooms = ?
                AND verified = true
                ORDER BY ABS(price - ?) ASC
                LIMIT ?
            ";

            $stmt = $db->prepare($query);
            $stmt->execute([
                $propertyId,
                $property['county'],
                $property['price'] - $priceRange,
                $property['price'] + $priceRange,
                $property['bedrooms'],
                $property['price'],
                $limit
            ]);

            return $stmt->fetchAll();
        } catch (Exception $e) {
            error_log("Fallback similar error: " . $e->getMessage());
            return [];
        }
    }
}
