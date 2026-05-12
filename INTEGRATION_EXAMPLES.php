<?php
/**
 * INTEGRATION GUIDE - Phase 2 & 3 API Updates
 * 
 * This file shows the exact changes needed to integrate:
 * - EventPublisher (Phase 3)
 * - CacheManager (Phase 2)
 * - FraudDetector (Phase 4)
 * 
 * Copy these snippets into your existing API endpoints
 */

// ============================================================================
// FILE: backend/api/auth/register.php
// ============================================================================
// ADD THESE IMPORTS AT THE TOP:

require_once '../../utils/EventPublisher.php';
require_once '../../utils/CacheManager.php';

// ADD THIS AFTER SUCCESSFUL USER REGISTRATION:

$publisher = new EventPublisher();
$cacheManager = new CacheManager();

// Publish signup event (triggers email worker)
$publisher->publishEvent('auth.events', 'user.signup', [
    'user_id' => $newUserId,
    'email' => $email,
    'username' => $fullName,
    'created_at' => time()
]);

// Invalidate relevant caches
$cacheManager->delete('users_list');
$cacheManager->delete('active_users_count');

// Send success response
http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Registration successful. Check your email for verification.',
    'user_id' => $newUserId
]);

// ============================================================================
// FILE: backend/api/auth/login.php
// ============================================================================
// ADD THESE IMPORTS AT THE TOP:

require_once '../../utils/EventPublisher.php';

// ADD THIS AFTER SUCCESSFUL LOGIN:

$publisher = new EventPublisher();

// Publish login event (optional tracking)
$publisher->publishEvent('auth.events', 'user.login', [
    'user_id' => $userId,
    'email' => $email,
    'ip_address' => $_SERVER['REMOTE_ADDR'],
    'created_at' => time()
]);

// ============================================================================
// FILE: backend/api/payments/create.php (or your payment endpoint)
// ============================================================================
// ADD THESE IMPORTS AT THE TOP:

require_once '../../utils/EventPublisher.php';
require_once '../../utils/FraudDetector.php';
require_once '../../utils/CacheManager.php';

// ADD THIS BEFORE PROCESSING PAYMENT:

$fraudDetector = new FraudDetector();
$publisher = new EventPublisher();
$cacheManager = new CacheManager();

// Check for fraud
$fraudResult = $fraudDetector->scoreTransaction([
    'user_id' => $_POST['user_id'],
    'amount' => $_POST['amount'],
    'device_fingerprint' => $_POST['device_fingerprint'] ?? null,
    'latitude' => $_POST['latitude'] ?? null,
    'longitude' => $_POST['longitude'] ?? null
]);

// Block if high risk
if ($fraudResult['recommendation'] === 'block_transaction') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'Transaction blocked for security reasons',
        'risk_score' => $fraudResult['risk_score']
    ]);
    exit;
}

// Request verification if medium risk
if ($fraudResult['recommendation'] === 'request_verification') {
    // Trigger 2FA verification (OTP)
    $_SESSION['pending_payment_id'] = $paymentId;
    $_SESSION['fraud_risk'] = true;
    
    http_response_code(202);
    echo json_encode([
        'success' => false,
        'error' => 'Security verification required',
        'requires_verification' => true
    ]);
    exit;
}

// ADD THIS AFTER SUCCESSFUL PAYMENT PROCESSING:

// Publish payment completed event (triggers SMS worker + receipt email)
$publisher->publishEvent('payment.events', 'payment.completed', [
    'transaction_id' => $transactionId,
    'user_id' => $_POST['user_id'],
    'amount' => $_POST['amount'],
    'property_id' => $_POST['property_id'] ?? null,
    'status' => 'completed',
    'created_at' => time()
]);

// Invalidate user payment caches
$cacheManager->delete("user_payments_{$_POST['user_id']}");
$cacheManager->delete("user_balance_{$_POST['user_id']}");

// Send success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Payment processed successfully',
    'transaction_id' => $transactionId,
    'fraud_risk_score' => $fraudResult['risk_score']
]);

// ============================================================================
// FILE: backend/api/properties/create.php
// ============================================================================
// ADD THESE IMPORTS AT THE TOP:

require_once '../../utils/EventPublisher.php';
require_once '../../utils/CacheManager.php';
require_once '../../utils/ShardManager.php';

// ADD THIS AFTER PROPERTY IS INSERTED INTO DATABASE:

$publisher = new EventPublisher();
$cacheManager = new CacheManager();
$shardManager = new ShardManager();

// Publish property created event (triggers search indexing)
$publisher->publishEvent('property.events', 'property.created', [
    'property_id' => $propertyId,
    'user_id' => $_POST['user_id'],
    'title' => $_POST['title'],
    'county' => $_POST['county'],
    'latitude' => $_POST['latitude'],
    'longitude' => $_POST['longitude'],
    'price' => $_POST['price'],
    'created_at' => time()
]);

// Invalidate listings cache
$cacheManager->delete('properties_list');
$cacheManager->delete("properties_county_{$_POST['county']}");
$cacheManager->delete('properties_trending');

// Send success response with shard information
$shard = $shardManager->getShardByCoordinates($_POST['latitude'], $_POST['longitude']);
http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Property created successfully',
    'property_id' => $propertyId,
    'shard' => $shard
]);

// ============================================================================
// FILE: backend/api/properties/list.php (ALREADY UPDATED - VERIFY)
// ============================================================================
// VERIFY THIS CODE IS PRESENT:

require_once '../../utils/CacheManager.php';

$cacheManager = new CacheManager();

try {
    // Build cache key from filters
    $cacheKey = 'properties_' . md5(json_encode($_GET));
    
    // Try to get from cache
    $cached = $cacheManager->get($cacheKey);
    if ($cached) {
        header('X-Cache: HIT');
        echo $cached;
        exit;
    }
    
    // Cache miss - fetch from database
    $query = "SELECT * FROM properties WHERE verified = true";
    $params = [];
    
    if (!empty($_GET['county'])) {
        $query .= " AND county = ?";
        $params[] = $_GET['county'];
    }
    
    $query .= " LIMIT 20";
    
    $db = Database::getInstance();
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $properties = $stmt->fetchAll();
    
    $response = json_encode(['success' => true, 'properties' => $properties]);
    
    // Store in cache for 1 hour
    $cacheManager->set($cacheKey, $response, 3600);
    
    header('X-Cache: MISS');
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// ============================================================================
// FILE: backend/api/properties/verify.php (ADMIN ONLY)
// ============================================================================
// ADD THIS TO PUBLISH PROPERTY VERIFICATION EVENT:

require_once '../../utils/EventPublisher.php';
require_once '../../utils/CacheManager.php';

$publisher = new EventPublisher();
$cacheManager = new CacheManager();

// Get property details before publishing
$propertyQuery = "SELECT user_id, title FROM properties WHERE id = ?";
$stmt = $db->prepare($propertyQuery);
$stmt->execute([$propertyId]);
$property = $stmt->fetch();

// Publish verification event (triggers landlord email + SMS)
$publisher->publishEvent('property.events', 'property.verified', [
    'property_id' => $propertyId,
    'user_id' => $property['user_id'],
    'title' => $property['title'],
    'verified_at' => time()
]);

// Invalidate caches
$cacheManager->delete('properties_list');
$cacheManager->delete("properties_county_{$_GET['county']}");
$cacheManager->delete('properties_trending');

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Property verified and landlord notified'
]);

// ============================================================================
// FILE: backend/api/reviews/create.php
// ============================================================================
// ADD THIS TO TRACK INTERACTIONS FOR RECOMMENDATIONS:

require_once '../../utils/RecommendationEngine.php';

$recommender = new RecommendationEngine();

// Track user review interaction (for ML model training)
$recommender->trackInteraction(
    $_POST['user_id'],
    $_POST['property_id'],
    'review'
);

// ============================================================================
// FILE: backend/api/search/nearby.php (NEW ENDPOINT)
// ============================================================================
// CREATE THIS NEW ENDPOINT FOR GEO-SPATIAL SEARCH:

<?php
header('Content-Type: application/json');

require_once '../../utils/ShardManager.php';
require_once '../../utils/CacheManager.php';

try {
    $latitude = (float)$_GET['lat'];
    $longitude = (float)$_GET['lon'];
    $radius = (int)($_GET['radius'] ?? 5);
    $limit = (int)($_GET['limit'] ?? 20);
    
    // Check cache first
    $cacheManager = new CacheManager();
    $cacheKey = "nearby_" . md5("$latitude,$longitude,$radius,$limit");
    $cached = $cacheManager->get($cacheKey);
    if ($cached) {
        header('X-Cache: HIT');
        echo $cached;
        exit;
    }
    
    // Query appropriate shard
    $shardMgr = new ShardManager();
    $results = $shardMgr->searchNearby($latitude, $longitude, $radius, $limit);
    
    $response = json_encode([
        'success' => true,
        'properties' => $results,
        'count' => count($results)
    ]);
    
    // Cache for 30 minutes
    $cacheManager->set($cacheKey, $response, 1800);
    
    header('X-Cache: MISS');
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// ============================================================================
// FILE: backend/api/search/full-text.php (NEW ENDPOINT)
// ============================================================================
// CREATE THIS NEW ENDPOINT FOR ELASTICSEARCH FULL-TEXT SEARCH:

<?php
header('Content-Type: application/json');

require_once '../../utils/ElasticsearchClient.php';
require_once '../../utils/CacheManager.php';

try {
    $query = $_GET['q'] ?? '';
    $filters = [
        'county' => $_GET['county'] ?? null,
        'price_min' => intval($_GET['price_min'] ?? 0),
        'price_max' => intval($_GET['price_max'] ?? 1000000),
        'bedrooms' => intval($_GET['bedrooms'] ?? 0),
        'from' => intval($_GET['from'] ?? 0),
        'size' => intval($_GET['size'] ?? 20)
    ];
    
    // Check cache
    $cacheManager = new CacheManager();
    $cacheKey = "search_" . md5(json_encode($filters) . $query);
    $cached = $cacheManager->get($cacheKey);
    if ($cached) {
        header('X-Cache: HIT');
        echo $cached;
        exit;
    }
    
    // Search Elasticsearch
    $es = new ElasticsearchClient();
    $result = $es->search($query, $filters);
    
    if (!$result['success']) {
        throw new Exception($result['error']);
    }
    
    $response = json_encode([
        'success' => true,
        'total' => $result['data']['hits']['total']['value'] ?? 0,
        'properties' => array_map(function($hit) {
            return $hit['_source'];
        }, $result['data']['hits']['hits'] ?? []),
        'aggregations' => $result['data']['aggregations'] ?? []
    ]);
    
    // Cache for 10 minutes
    $cacheManager->set($cacheKey, $response, 600);
    
    header('X-Cache: MISS');
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// ============================================================================
// FILE: backend/api/recommendations/personalized.php (NEW ENDPOINT)
// ============================================================================
// CREATE THIS NEW ENDPOINT FOR ML RECOMMENDATIONS:

<?php
header('Content-Type: application/json');

require_once '../../utils/RecommendationEngine.php';

try {
    $userId = (int)$_GET['user_id'];
    $limit = (int)($_GET['limit'] ?? 10);
    
    $recommender = new RecommendationEngine();
    $result = $recommender->getRecommendations($userId, $limit);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'source' => $result['source'],
        'recommendations' => $result['recommendations']
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// ============================================================================
// TESTING: Verify All Integrations
// ============================================================================

/**
 * Test script to verify all integrations are working
 * Run from: php -f backend/scripts/test-integrations.php
 */

echo "=== HouseCom Integration Tests ===\n\n";

// Test 1: EventPublisher
echo "1. Testing EventPublisher...\n";
require_once 'backend/utils/EventPublisher.php';
$publisher = new EventPublisher();
$result = $publisher->publishEvent('test.events', 'test', ['message' => 'test']);
echo $result ? "✓ EventPublisher working\n" : "✗ EventPublisher failed\n";

// Test 2: CacheManager
echo "\n2. Testing CacheManager...\n";
require_once 'backend/utils/CacheManager.php';
$cache = new CacheManager();
$cache->set('test_key', 'test_value', 3600);
$value = $cache->get('test_key');
echo ($value === 'test_value' ? "✓ CacheManager working\n" : "✗ CacheManager failed\n");

// Test 3: ShardManager
echo "\n3. Testing ShardManager...\n";
require_once 'backend/utils/ShardManager.php';
$shardMgr = new ShardManager();
$shard = $shardMgr->getShardByCoordinates(-4.04, 39.66);
echo ("mombasa" === $shard ? "✓ ShardManager working\n" : "✗ ShardManager failed\n");

// Test 4: FraudDetector
echo "\n4. Testing FraudDetector...\n";
require_once 'backend/utils/FraudDetector.php';
$detector = new FraudDetector();
$result = $detector->scoreTransaction(['user_id' => 1, 'amount' => 50000]);
echo (isset($result['risk_score']) ? "✓ FraudDetector working (risk: {$result['risk_score']})\n" : "✗ FraudDetector failed\n");

// Test 5: RecommendationEngine
echo "\n5. Testing RecommendationEngine...\n";
require_once 'backend/utils/RecommendationEngine.php';
$recommender = new RecommendationEngine();
echo "✓ RecommendationEngine loaded\n";

// Test 6: Elasticsearch
echo "\n6. Testing ElasticsearchClient...\n";
require_once 'backend/utils/ElasticsearchClient.php';
$es = new ElasticsearchClient();
$health = $es->health();
echo ($health['success'] ? "✓ Elasticsearch connected\n" : "✗ Elasticsearch failed\n");

echo "\n=== All Integration Tests Complete ===\n";
