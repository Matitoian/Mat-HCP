<?php
/**
 * Property Review Model
 */

class PropertyReview {
    private $conn;
    private $table = 'property_reviews';

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create review
    public function create($data) {
        $query = "INSERT INTO " . $this->table . " 
                 SET id = :id,
                     property_id = :property_id,
                     user_id = :user_id,
                     rating = :rating,
                     review_text = :review_text,
                     cleanliness_rating = :cleanliness_rating,
                     security_rating = :security_rating,
                     location_rating = :location_rating,
                     value_rating = :value_rating,
                     status = :status";

        $stmt = $this->conn->prepare($query);

        $id = generateUUID();
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':property_id', $data['property_id']);
        $stmt->bindParam(':user_id', $data['user_id']);
        $stmt->bindParam(':rating', $data['rating']);
        $stmt->bindParam(':review_text', $data['review_text']);
        $stmt->bindParam(':cleanliness_rating', $data['cleanliness_rating']);
        $stmt->bindParam(':security_rating', $data['security_rating']);
        $stmt->bindParam(':location_rating', $data['location_rating']);
        $stmt->bindParam(':value_rating', $data['value_rating']);
        $stmt->bindParam(':status', $data['status']);

        if ($stmt->execute()) {
            return $id;
        }
        return false;
    }

    // Get review by ID
    public function getReviewById($id) {
        $query = "SELECT r.*, u.full_name as user_name 
                 FROM " . $this->table . " r
                 LEFT JOIN users u ON r.user_id = u.id
                 WHERE r.id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    // Get reviews for a property
    public function getByProperty($propertyId, $status = 'approved') {
        $query = "SELECT r.*, u.full_name as user_name, u.profile_image 
                 FROM " . $this->table . " r
                 LEFT JOIN users u ON r.user_id = u.id
                 WHERE r.property_id = ? AND r.status = ?
                 ORDER BY r.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$propertyId, $status]);
        return $stmt->fetchAll();
    }

    // Check if user already reviewed
    public function hasUserReviewed($userId, $propertyId) {
        $query = "SELECT id FROM " . $this->table . " 
                 WHERE user_id = ? AND property_id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$userId, $propertyId]);
        return $stmt->fetch() ? true : false;
    }

    // Approve review (admin)
    public function approve($reviewId) {
        $query = "UPDATE " . $this->table . " SET status = 'approved' WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$reviewId]);
    }

    // Reject review (admin)
    public function reject($reviewId) {
        $query = "UPDATE " . $this->table . " SET status = 'rejected' WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$reviewId]);
    }

    // Get pending reviews (admin)
    public function getPending($limit = 20, $offset = 0) {
        $query = "SELECT r.*, 
                        u.full_name as user_name,
                        p.title as property_title
                 FROM " . $this->table . " r
                 LEFT JOIN users u ON r.user_id = u.id
                 LEFT JOIN properties p ON r.property_id = p.id
                 WHERE r.status = 'pending'
                 ORDER BY r.created_at DESC
                 LIMIT ? OFFSET ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([(int)$limit, (int)$offset]);
        return $stmt->fetchAll();
    }
}
