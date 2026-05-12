<?php
/**
 * Create Property Review
 * POST /api/reviews/create.php
 */

require_once '../../config/config.php';
require_once '../../models/PropertyReview.php';
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
if (!isset($data['propertyId']) || !isset($data['rating'])) {
    errorResponse('Property ID and rating are required');
}

$propertyId = $data['propertyId'];
$rating = intval($data['rating']);
$reviewText = isset($data['reviewText']) ? htmlspecialchars(strip_tags($data['reviewText'])) : null;
$cleanlinessRating = isset($data['cleanlinessRating']) ? intval($data['cleanlinessRating']) : null;
$securityRating = isset($data['securityRating']) ? intval($data['securityRating']) : null;
$locationRating = isset($data['locationRating']) ? intval($data['locationRating']) : null;
$valueRating = isset($data['valueRating']) ? intval($data['valueRating']) : null;

// Validate rating
if ($rating < 1 || $rating > 5) {
    errorResponse('Rating must be between 1 and 5');
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $review = new PropertyReview($db);

    // Check if property exists
    $stmt = $db->prepare("SELECT id FROM properties WHERE id = ?");
    $stmt->execute([$propertyId]);
    if (!$stmt->fetch()) {
        errorResponse('Property not found', 404);
    }

    // Check if user already reviewed this property
    if ($review->hasUserReviewed($auth['user_id'], $propertyId)) {
        errorResponse('You have already reviewed this property', 409);
    }

    // Create review
    $reviewId = $review->create([
        'property_id' => $propertyId,
        'user_id' => $auth['user_id'],
        'rating' => $rating,
        'review_text' => $reviewText,
        'cleanliness_rating' => $cleanlinessRating,
        'security_rating' => $securityRating,
        'location_rating' => $locationRating,
        'value_rating' => $valueRating,
        'status' => 'pending' // Pending admin approval
    ]);

    if (!$reviewId) {
        errorResponse('Failed to create review', 500);
    }

    // Get created review
    $createdReview = $review->getReviewById($reviewId);

    jsonResponse([
        'success' => true,
        'message' => 'Review submitted successfully. Pending approval.',
        'data' => $createdReview
    ], 201);

} catch (Exception $e) {
    error_log("Create review error: " . $e->getMessage());
    errorResponse('Failed to create review', 500);
}
