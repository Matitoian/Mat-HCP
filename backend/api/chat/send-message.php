<?php
/**
 * Send Chat Message
 * POST /api/chat/send-message.php
 */

require_once '../../config/config.php';
require_once '../../models/ChatMessage.php';
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
if (!isset($data['receiverId']) || !isset($data['message'])) {
    errorResponse('Receiver ID and message are required');
}

$senderId = $auth['user_id'];
$receiverId = $data['receiverId'];
$message = htmlspecialchars(strip_tags($data['message']));
$propertyId = isset($data['propertyId']) ? $data['propertyId'] : null;

if (empty($message)) {
    errorResponse('Message cannot be empty');
}

if ($senderId === $receiverId) {
    errorResponse('Cannot send message to yourself');
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $chat = new ChatMessage($db);

    // Verify receiver exists
    $stmt = $db->prepare("SELECT id FROM users WHERE id = ? AND status = 'active'");
    $stmt->execute([$receiverId]);
    if (!$stmt->fetch()) {
        errorResponse('Receiver not found', 404);
    }

    // Create message
    $messageId = $chat->create([
        'sender_id' => $senderId,
        'receiver_id' => $receiverId,
        'property_id' => $propertyId,
        'message' => $message
    ]);

    if (!$messageId) {
        errorResponse('Failed to send message', 500);
    }

    // Get created message
    $createdMessage = $chat->getMessageById($messageId);

    // TODO: Send real-time notification via WebSocket/Pusher
    // TODO: Send push notification to receiver

    jsonResponse([
        'success' => true,
        'message' => 'Message sent successfully',
        'data' => $createdMessage
    ], 201);

} catch (Exception $e) {
    error_log("Send message error: " . $e->getMessage());
    errorResponse('Failed to send message', 500);
}
