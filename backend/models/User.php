<?php
/**
 * User Model
 */

class User {
    private $conn;
    private $table = 'users';

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create user
    public function create($data) {
        $query = "INSERT INTO " . $this->table . " 
                 SET id = :id,
                     email = :email,
                     password_hash = :password_hash,
                     full_name = :full_name,
                     phone = :phone,
                     role = :role,
                     university = :university,
                     student_id = :student_id,
                     profile_image = :profile_image,
                     auth_provider = :auth_provider,
                     google_id = :google_id,
                     apple_id = :apple_id,
                     verified = :verified";

        $stmt = $this->conn->prepare($query);

        $id = generateUUID();
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':password_hash', $data['password_hash'] ?? null);
        $stmt->bindParam(':full_name', $data['full_name']);
        $stmt->bindParam(':phone', $data['phone'] ?? null);
        $stmt->bindParam(':role', $data['role']);
        $stmt->bindParam(':university', $data['university'] ?? null);
        $stmt->bindParam(':student_id', $data['student_id'] ?? null);
        $stmt->bindParam(':profile_image', $data['profile_image'] ?? null);
        $stmt->bindParam(':auth_provider', $data['auth_provider']);
        $stmt->bindParam(':google_id', $data['google_id'] ?? null);
        $stmt->bindParam(':apple_id', $data['apple_id'] ?? null);
        $verified = $data['verified'] ?? false;
        $stmt->bindParam(':verified', $verified, PDO::PARAM_BOOL);

        if ($stmt->execute()) {
            return $id;
        }
        return false;
    }

    // Get user by email
    public function getUserByEmail($email) {
        $query = "SELECT * FROM " . $this->table . " WHERE email = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    // Get user by ID
    public function getUserById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    // Check if email exists
    public function emailExists($email) {
        $query = "SELECT id FROM " . $this->table . " WHERE email = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$email]);
        return $stmt->fetch() ? true : false;
    }

    // Update last login
    public function updateLastLogin($userId) {
        $query = "UPDATE " . $this->table . " SET last_login = NOW() WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$userId]);
    }

    // Update Google ID
    public function updateGoogleId($userId, $googleId) {
        $query = "UPDATE " . $this->table . " SET google_id = ? WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$googleId, $userId]);
    }

    // Update Apple ID
    public function updateAppleId($userId, $appleId) {
        $query = "UPDATE " . $this->table . " SET apple_id = ? WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$appleId, $userId]);
    }

    // Update user profile
    public function update($userId, $data) {
        $fields = [];
        $values = [];

        $allowedFields = ['full_name', 'phone', 'university', 'student_id', 'profile_image', 'id_number'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $values[] = $userId;
        $query = "UPDATE " . $this->table . " SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($values);
    }

    // Verify user
    public function verify($userId) {
        $query = "UPDATE " . $this->table . " SET verified = TRUE WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$userId]);
    }

    // Suspend user
    public function suspend($userId) {
        $query = "UPDATE " . $this->table . " SET status = 'suspended' WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$userId]);
    }

    // Activate user
    public function activate($userId) {
        $query = "UPDATE " . $this->table . " SET status = 'active' WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$userId]);
    }

    // Get all users (admin)
    public function getAll($filters = []) {
        $query = "SELECT id, email, full_name, phone, role, university, verified, status, created_at 
                 FROM " . $this->table . " WHERE 1=1";
        
        $params = [];

        if (isset($filters['role'])) {
            $query .= " AND role = ?";
            $params[] = $filters['role'];
        }

        if (isset($filters['verified'])) {
            $query .= " AND verified = ?";
            $params[] = $filters['verified'];
        }

        if (isset($filters['status'])) {
            $query .= " AND status = ?";
            $params[] = $filters['status'];
        }

        $query .= " ORDER BY created_at DESC";

        if (isset($filters['limit']) && isset($filters['offset'])) {
            $query .= " LIMIT ? OFFSET ?";
            $params[] = $filters['limit'];
            $params[] = $filters['offset'];
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    // Get total count
    public function getTotalCount($filters = []) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table . " WHERE 1=1";
        $params = [];

        if (isset($filters['role'])) {
            $query .= " AND role = ?";
            $params[] = $filters['role'];
        }

        if (isset($filters['verified'])) {
            $query .= " AND verified = ?";
            $params[] = $filters['verified'];
        }

        if (isset($filters['status'])) {
            $query .= " AND status = ?";
            $params[] = $filters['status'];
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return $result['total'];
    }
}
