<?php
/**
 * Report Fraud
 * POST /api/fraud/report.php
 */

require_once '../../config/config.php';
require_once '../../models/FraudReport.php';
require_once '../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

// Authenticate user
$auth = authenticate();
if (!$auth) {
    errorResponse('Unauthorized', 401);
}

$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
if (!isset($data['reportedType']) || !isset($data['reason'])) {
    errorResponse('Reported type and reason are required');
}

$reportedType = $data['reportedType'];
$reason = $data['reason'];
$description = isset($data['description']) ? htmlspecialchars(strip_tags($data['description'])) : null;
$reportedPropertyId = isset($data['propertyId']) ? $data['propertyId'] : null;
$reportedUserId = isset($data['userId']) ? $data['userId'] : null;
$evidenceUrls = isset($data['evidenceUrls']) ? json_encode($data['evidenceUrls']) : null;

// Validate reported type
if (!in_array($reportedType, ['property', 'user'])) {
    errorResponse('Invalid reported type. Must be either property or user');
}

// Validate reason
$validReasons = ['fake_listing', 'fake_photos', 'scam', 'impersonation', 'other'];
if (!in_array($reason, $validReasons)) {
    errorResponse('Invalid reason');
}

// Ensure either property or user is reported
if ($reportedType === 'property' && !$reportedPropertyId) {
    errorResponse('Property ID is required when reporting a property');
}
if ($reportedType === 'user' && !$reportedUserId) {
    errorResponse('User ID is required when reporting a user');
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $fraudReport = new FraudReport($db);

    // Create fraud report
    $reportId = $fraudReport->create([
        'reporter_id' => $auth['user_id'],
        'reported_type' => $reportedType,
        'reported_property_id' => $reportedPropertyId,
        'reported_user_id' => $reportedUserId,
        'reason' => $reason,
        'description' => $description,
        'evidence_urls' => $evidenceUrls,
        'status' => 'pending'
    ]);

    if (!$reportId) {
        errorResponse('Failed to submit report', 500);
    }

    // TODO: Notify admin team
    // TODO: Run AI-based fraud detection on reported item

    jsonResponse([
        'success' => true,
        'message' => 'Report submitted successfully. Our team will review it shortly.',
        'data' => [
            'reportId' => $reportId
        ]
    ], 201);

} catch (Exception $e) {
    error_log("Fraud report error: " . $e->getMessage());
    errorResponse('Failed to submit report', 500);
}
