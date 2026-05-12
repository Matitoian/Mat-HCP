<?php
/**
 * Verify Property (Admin Only)
 * POST /api/admin/verify-property.php
 */

require_once '../../config/config.php';
require_once '../../models/Property.php';
require_once '../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

// Authenticate admin
$auth = requireAdmin();

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['propertyId'])) {
    errorResponse('Property ID is required');
}

$propertyId = $data['propertyId'];

try {
    $database = new Database();
    $db = $database->getConnection();
    $property = new Property($db);

    // Check if property exists
    $propertyData = $property->getPropertyById($propertyId);
    if (!$propertyData) {
        errorResponse('Property not found', 404);
    }

    // Verify property
    $success = $property->verifyProperty($propertyId, $auth['user_id']);

    if (!$success) {
        errorResponse('Failed to verify property', 500);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Property verified successfully'
    ]);

} catch (Exception $e) {
    error_log("Verify property error: " . $e->getMessage());
    errorResponse('Failed to verify property', 500);
}
