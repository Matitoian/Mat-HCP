<?php
/**
 * Create Property (Landlord)
 * POST /api/properties/create.php
 */

require_once '../../config/config.php';
require_once '../../models/Property.php';
require_once '../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

// Authenticate user
$auth = authenticate();
if (!$auth || $auth['role'] !== 'landlord') {
    errorResponse('Unauthorized. Only landlords can create properties', 403);
}

$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
$required = ['title', 'description', 'propertyType', 'price', 'county', 'location', 'bedrooms', 'bathrooms'];
foreach ($required as $field) {
    if (!isset($data[$field])) {
        errorResponse("Field '{$field}' is required");
    }
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $property = new Property($db);

    // Prepare property data
    $propertyData = [
        'landlord_id' => $auth['user_id'],
        'title' => htmlspecialchars(strip_tags($data['title'])),
        'description' => htmlspecialchars(strip_tags($data['description'])),
        'property_type' => $data['propertyType'],
        'price' => floatval($data['price']),
        'county' => $data['county'],
        'location' => htmlspecialchars(strip_tags($data['location'])),
        'latitude' => isset($data['latitude']) ? floatval($data['latitude']) : null,
        'longitude' => isset($data['longitude']) ? floatval($data['longitude']) : null,
        'bedrooms' => intval($data['bedrooms']),
        'bathrooms' => intval($data['bathrooms']),
        'university_name' => isset($data['universityName']) ? htmlspecialchars(strip_tags($data['universityName'])) : null,
        'distance_to_uni' => isset($data['distanceToUni']) ? floatval($data['distanceToUni']) : null,
        'beach_distance' => isset($data['beachDistance']) ? floatval($data['beachDistance']) : null,
        'amenities' => isset($data['amenities']) ? json_encode($data['amenities']) : '[]',
        'askari_24hr' => isset($data['askari24hr']) ? filter_var($data['askari24hr'], FILTER_VALIDATE_BOOLEAN) : false,
        'cctv' => isset($data['cctv']) ? filter_var($data['cctv'], FILTER_VALIDATE_BOOLEAN) : false,
        'fence' => isset($data['fence']) ? filter_var($data['fence'], FILTER_VALIDATE_BOOLEAN) : false,
        'compound_type' => isset($data['compoundType']) ? htmlspecialchars(strip_tags($data['compoundType'])) : null,
        'mpesa_till_number' => isset($data['mpesaTill']) ? htmlspecialchars(strip_tags($data['mpesaTill'])) : null,
        'mpesa_paybill' => isset($data['mpesaPaybill']) ? htmlspecialchars(strip_tags($data['mpesaPaybill'])) : null,
        'status' => 'pending' // Pending admin approval
    ];

    // Calculate security score
    $securityScore = 0;
    if ($propertyData['askari_24hr']) $securityScore += 2;
    if ($propertyData['cctv']) $securityScore += 2;
    if ($propertyData['fence']) $securityScore += 1;
    $propertyData['security_score'] = min(5, $securityScore);

    // Create property
    $propertyId = $property->create($propertyData);

    if (!$propertyId) {
        errorResponse('Failed to create property', 500);
    }

    // Handle image uploads if present
    if (isset($data['images']) && is_array($data['images'])) {
        $property->addImages($propertyId, $data['images']);
    }

    // Get created property
    $createdProperty = $property->getPropertyById($propertyId);

    jsonResponse([
        'success' => true,
        'message' => 'Property created successfully. Pending admin approval.',
        'data' => $createdProperty
    ], 201);

} catch (Exception $e) {
    error_log("Create property error: " . $e->getMessage());
    errorResponse('Failed to create property', 500);
}
