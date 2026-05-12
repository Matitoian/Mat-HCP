<?php
/**
 * Chat Message Model
 */

class ChatMessage {
    private $conn;
    private $table = 'chat_messages';

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create message
    public function create($data) {
        $query = "INSERT INTO " . $this->table . " 
                 SET id = :id,
                     sender_id = :sender_id,
                     receiver_id = :receiver_id,
                     property_id = :property_id,
                     message = :message";

        $stmt = $this->conn->prepare($query);

        $id = generateUUID();
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':sender_id', $data['sender_id']);
        $stmt->bindParam(':receiver_id', $data['receiver_id']);
        $stmt->bindParam(':property_id', $data['property_id']);
        $stmt->bindParam(':message', $data['message']);

        if ($stmt->execute()) {
            return $id;
        }
        return false;
    }

    // Get message by ID
    public function getMessageById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    // Get conversation between two users
    public function getConversation($user1Id, $user2Id, $limit = 100) {
        $query = "SELECT m.*,
                        sender.full_name as sender_name,
                        sender.profile_image as sender_image,
                        receiver.full_name as receiver_name,
                        receiver.profile_image as receiver_image
                 FROM " . $this->table . " m
                 LEFT JOIN users sender ON m.sender_id = sender.id
                 LEFT JOIN users receiver ON m.receiver_id = receiver.id
                 WHERE (m.sender_id = ? AND m.receiver_id = ?)
                    OR (m.sender_id = ? AND m.receiver_id = ?)
                 ORDER BY m.sent_at ASC
                 LIMIT ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$user1Id, $user2Id, $user2Id, $user1Id, (int)$limit]);
        return $stmt->fetchAll();
    }

    // Get chat list for a user
    public function getChatList($userId) {
        $query = "SELECT 
                    CASE 
                        WHEN m.sender_id = ? THEN m.receiver_id 
                        ELSE m.sender_id 
                    END as other_user_id,
                    CASE 
                        WHEN m.sender_id = ? THEN receiver.full_name 
                        ELSE sender.full_name 
                    END as other_user_name,
                    CASE 
                        WHEN m.sender_id = ? THEN receiver.profile_image 
                        ELSE sender.profile_image 
                    END as other_user_image,
                    m.message as last_message,
                    m.sent_at as last_message_time,
                    m.is_read,
                    p.title as property_title
                 FROM " . $this->table . " m
                 INNER JOIN (
                    SELECT 
                        CASE 
                            WHEN sender_id = ? THEN receiver_id 
                            ELSE sender_id 
                        END as other_user,
                        MAX(sent_at) as max_time
                    FROM " . $this->table . "
                    WHERE sender_id = ? OR receiver_id = ?
                    GROUP BY other_user
                 ) latest ON (
                    (m.sender_id = ? AND m.receiver_id = latest.other_user)
                    OR (m.receiver_id = ? AND m.sender_id = latest.other_user)
                 ) AND m.sent_at = latest.max_time
                 LEFT JOIN users sender ON m.sender_id = sender.id
                 LEFT JOIN users receiver ON m.receiver_id = receiver.id
                 LEFT JOIN properties p ON m.property_id = p.id
                 ORDER BY m.sent_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId, $userId, $userId]);
        return $stmt->fetchAll();
    }

    // Mark messages as read
    public function markAsRead($senderId, $receiverId) {
        $query = "UPDATE " . $this->table . " 
                 SET is_read = TRUE 
                 WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$senderId, $receiverId]);
    }

    // Get unread count
    public function getUnreadCount($userId) {
        $query = "SELECT COUNT(*) as unread 
                 FROM " . $this->table . " 
                 WHERE receiver_id = ? AND is_read = FALSE";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        return $result['unread'];
    }

    // Delete message
    public function delete($messageId, $userId) {
        $query = "DELETE FROM " . $this->table . " 
                 WHERE id = ? AND (sender_id = ? OR receiver_id = ?)";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$messageId, $userId, $userId]);
    }
}
