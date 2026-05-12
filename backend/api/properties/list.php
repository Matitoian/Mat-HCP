<?php
/**
 * Get Properties List with Filters
 * GET /api/properties/list.php
 * Phase 2: Integrated Redis Caching
 */

require_once '../../config/config.php';
require_once '../../models/Property.php';
require_once '../../utils/CacheManager.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

try {
    $cache = new CacheManager();
    $database = new Database();
    $db = $database->getConnection();
    $property = new Property($db);

    // Get query parameters
    $county = isset($_GET['county']) ? $_GET['county'] : null;
    $propertyType = isset($_GET['type']) ? $_GET['type'] : null;
    $minPrice = isset($_GET['minPrice']) ? intval($_GET['minPrice']) : null;
    $maxPrice = isset($_GET['maxPrice']) ? intval($_GET['maxPrice']) : null;
    $bedrooms = isset($_GET['bedrooms']) ? intval($_GET['bedrooms']) : null;
    $university = isset($_GET['university']) ? $_GET['university'] : null;
    $verified = isset($_GET['verified']) ? filter_var($_GET['verified'], FILTER_VALIDATE_BOOLEAN) : null;
    $search = isset($_GET['search']) ? $_GET['search'] : null;
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(50, intval($_GET['limit'])) : ITEMS_PER_PAGE;
    $offset = ($page - 1) * $limit;

    // Build cache key from filters
    $cacheKey = 'properties_' . md5(json_encode([
        'county' => $county,
        'type' => $propertyType,
        'minPrice' => $minPrice,
        'maxPrice' => $maxPrice,
        'bedrooms' => $bedrooms,
        'university' => $university,
        'verified' => $verified,
        'search' => $search,
        'page' => $page
    ]));

    // Try cache first (1 hour TTL)
    $cached = $cache->getPropertyList($cacheKey);
    if ($cached) {
        http_response_code(200);
        header('X-Cache: HIT');
        echo json_encode($cached + ['cached' => true]);
        exit;
    }

    // Build filters
    $filters = [
        'county' => $county,
        'property_type' => $propertyType,
        'min_price' => $minPrice,
        'max_price' => $maxPrice,
        'bedrooms' => $bedrooms,
        'university' => $university,
        'verified' => $verified,
        'search' => $search,
        'status' => 'active',
        'limit' => $limit,
        'offset' => $offset
    ];

    // Get properties from database
    $properties = $property->getProperties($filters);
    $total = $property->getTotalCount($filters);

    $response = [
        'success' => true,
        'data' => $properties,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'totalPages' => ceil($total / $limit)
        ],
        'cached' => false
    ];

    // Cache the result (1 hour)
    $cache->setPropertyList($cacheKey, $response, 3600);

    // Invalidate cache when properties are listed for first time
    error_log("Properties cached: $cacheKey");

    http_response_code(200);
    header('X-Cache: MISS');
    jsonResponse($response);

} catch (Exception $e) {
    error_log("Get properties error: " . $e->getMessage());
    errorResponse('Failed to fetch properties', 500);
}
