<?php
/**
 * Fraud Report Model
 */

class FraudReport {
    private $conn;
    private $table = 'fraud_reports';

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create fraud report
    public function create($data) {
        $query = "INSERT INTO " . $this->table . " 
                 SET id = :id,
                     reporter_id = :reporter_id,
                     reported_type = :reported_type,
                     reported_property_id = :reported_property_id,
                     reported_user_id = :reported_user_id,
                     reason = :reason,
                     description = :description,
                     evidence_urls = :evidence_urls,
                     status = :status";

        $stmt = $this->conn->prepare($query);

        $id = generateUUID();
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':reporter_id', $data['reporter_id']);
        $stmt->bindParam(':reported_type', $data['reported_type']);
        $stmt->bindParam(':reported_property_id', $data['reported_property_id']);
        $stmt->bindParam(':reported_user_id', $data['reported_user_id']);
        $stmt->bindParam(':reason', $data['reason']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':evidence_urls', $data['evidence_urls']);
        $stmt->bindParam(':status', $data['status']);

        if ($stmt->execute()) {
            return $id;
        }
        return false;
    }

    // Get all reports (admin)
    public function getAll($filters = [], $limit = 20, $offset = 0) {
        $query = "SELECT f.*, 
                        reporter.full_name as reporter_name,
                        p.title as property_title,
                        reported_user.full_name as reported_user_name
                 FROM " . $this->table . " f
                 LEFT JOIN users reporter ON f.reporter_id = reporter.id
                 LEFT JOIN properties p ON f.reported_property_id = p.id
                 LEFT JOIN users reported_user ON f.reported_user_id = reported_user.id
                 WHERE 1=1";
        
        $params = [];

        if (isset($filters['status'])) {
            $query .= " AND f.status = ?";
            $params[] = $filters['status'];
        }

        if (isset($filters['reported_type'])) {
            $query .= " AND f.reported_type = ?";
            $params[] = $filters['reported_type'];
        }

        $query .= " ORDER BY f.created_at DESC LIMIT ? OFFSET ?";
        $params[] = (int)$limit;
        $params[] = (int)$offset;

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    // Get report by ID
    public function getById($id) {
        $query = "SELECT f.*, 
                        reporter.full_name as reporter_name,
                        reporter.email as reporter_email,
                        p.title as property_title,
                        reported_user.full_name as reported_user_name
                 FROM " . $this->table . " f
                 LEFT JOIN users reporter ON f.reporter_id = reporter.id
                 LEFT JOIN properties p ON f.reported_property_id = p.id
                 LEFT JOIN users reported_user ON f.reported_user_id = reported_user.id
                 WHERE f.id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    // Update status
    public function updateStatus($reportId, $status, $adminId = null, $notes = null) {
        $query = "UPDATE " . $this->table . " 
                 SET status = ?,
                     resolved_by = ?,
                     admin_notes = ?,
                     resolved_at = ?
                 WHERE id = ?";
        
        $resolvedAt = ($status === 'resolved') ? date('Y-m-d H:i:s') : null;
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$status, $adminId, $notes, $resolvedAt, $reportId]);
    }

    // Get reports count by status
    public function getCountByStatus() {
        $query = "SELECT status, COUNT(*) as count 
                 FROM " . $this->table . " 
                 GROUP BY status";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    // Get pending reports count
    public function getPendingCount() {
        $query = "SELECT COUNT(*) as count 
                 FROM " . $this->table . " 
                 WHERE status = 'pending'";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch();
        return $result['count'];
    }
}
