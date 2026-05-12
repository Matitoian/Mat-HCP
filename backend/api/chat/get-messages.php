<?php
/**
 * Get Chat Messages
 * GET /api/chat/get-messages.php?userId=xxx
 */

require_once '../../config/config.php';
require_once '../../models/ChatMessage.php';
require_once '../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

// Authenticate user
$auth = authenticate();
if (!$auth) {
    errorResponse('Unauthorized', 401);
}

if (!isset($_GET['userId'])) {
    errorResponse('User ID is required');
}

$currentUserId = $auth['user_id'];
$otherUserId = $_GET['userId'];

try {
    $database = new Database();
    $db = $database->getConnection();
    $chat = new ChatMessage($db);

    // Get conversation between two users
    $messages = $chat->getConversation($currentUserId, $otherUserId);

    // Mark messages as read
    $chat->markAsRead($otherUserId, $currentUserId);

    jsonResponse([
        'success' => true,
        'data' => $messages
    ]);

} catch (Exception $e) {
    error_log("Get messages error: " . $e->getMessage());
    errorResponse('Failed to fetch messages', 500);
}
