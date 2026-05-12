<?php
/**
 * Payment Transaction Model
 */

class PaymentTransaction {
    private $conn;
    private $table = 'payment_transactions';

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create transaction
    public function create($data) {
        $query = "INSERT INTO " . $this->table . " 
                 SET id = :id,
                     transaction_id = :transaction_id,
                     property_id = :property_id,
                     tenant_id = :tenant_id,
                     landlord_id = :landlord_id,
                     amount = :amount,
                     payment_type = :payment_type,
                     payment_method = :payment_method,
                     mpesa_phone = :mpesa_phone,
                     status = :status,
                     payment_for_month = :payment_for_month";

        $stmt = $this->conn->prepare($query);

        $id = generateUUID();
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':transaction_id', $data['transaction_id']);
        $stmt->bindParam(':property_id', $data['property_id']);
        $stmt->bindParam(':tenant_id', $data['tenant_id']);
        $stmt->bindParam(':landlord_id', $data['landlord_id']);
        $stmt->bindParam(':amount', $data['amount']);
        $stmt->bindParam(':payment_type', $data['payment_type']);
        $stmt->bindParam(':payment_method', $data['payment_method']);
        $stmt->bindParam(':mpesa_phone', $data['mpesa_phone']);
        $stmt->bindParam(':status', $data['status']);
        $paymentForMonth = $data['payment_for_month'] ?? date('Y-m-01');
        $stmt->bindParam(':payment_for_month', $paymentForMonth);

        if ($stmt->execute()) {
            return $id;
        }
        return false;
    }

    // Get transaction by ID
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    // Get by checkout request ID
    public function getByCheckoutRequestId($checkoutRequestId) {
        $query = "SELECT * FROM " . $this->table . " 
                 WHERE mpesa_receipt LIKE ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['%' . $checkoutRequestId . '%']);
        return $stmt->fetch();
    }

    // Update status
    public function updateStatus($id, $status) {
        $query = "UPDATE " . $this->table . " SET status = ? WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$status, $id]);
    }

    // Update with M-PESA details
    public function update($id, $data) {
        $fields = [];
        $values = [];

        $allowedFields = ['status', 'mpesa_receipt', 'mpesa_phone'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $values[] = $id;
        $query = "UPDATE " . $this->table . " SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($values);
    }

    // Update checkout request ID
    public function updateCheckoutRequestId($id, $checkoutRequestId) {
        $query = "UPDATE " . $this->table . " 
                 SET mpesa_receipt = CONCAT(COALESCE(mpesa_receipt, ''), ?,' | CheckoutRequestID: ', ?)
                 WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['', $checkoutRequestId, $id]);
    }

    // Get transactions for a tenant
    public function getByTenant($tenantId, $limit = 20, $offset = 0) {
        $query = "SELECT t.*, 
                        p.title as property_title,
                        p.location as property_location
                 FROM " . $this->table . " t
                 LEFT JOIN properties p ON t.property_id = p.id
                 WHERE t.tenant_id = ?
                 ORDER BY t.created_at DESC
                 LIMIT ? OFFSET ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$tenantId, (int)$limit, (int)$offset]);
        return $stmt->fetchAll();
    }

    // Get transactions for a landlord
    public function getByLandlord($landlordId, $limit = 20, $offset = 0) {
        $query = "SELECT t.*, 
                        p.title as property_title,
                        p.location as property_location,
                        u.full_name as tenant_name,
                        u.phone as tenant_phone
                 FROM " . $this->table . " t
                 LEFT JOIN properties p ON t.property_id = p.id
                 LEFT JOIN users u ON t.tenant_id = u.id
                 WHERE t.landlord_id = ?
                 ORDER BY t.created_at DESC
                 LIMIT ? OFFSET ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$landlordId, (int)$limit, (int)$offset]);
        return $stmt->fetchAll();
    }

    // Get all transactions (admin)
    public function getAll($filters = [], $limit = 20, $offset = 0) {
        $query = "SELECT t.*, 
                        p.title as property_title,
                        tenant.full_name as tenant_name,
                        landlord.full_name as landlord_name
                 FROM " . $this->table . " t
                 LEFT JOIN properties p ON t.property_id = p.id
                 LEFT JOIN users tenant ON t.tenant_id = tenant.id
                 LEFT JOIN users landlord ON t.landlord_id = landlord.id
                 WHERE 1=1";
        
        $params = [];

        if (isset($filters['status'])) {
            $query .= " AND t.status = ?";
            $params[] = $filters['status'];
        }

        if (isset($filters['payment_type'])) {
            $query .= " AND t.payment_type = ?";
            $params[] = $filters['payment_type'];
        }

        $query .= " ORDER BY t.created_at DESC LIMIT ? OFFSET ?";
        $params[] = (int)$limit;
        $params[] = (int)$offset;

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    // Get revenue statistics
    public function getRevenueStats($landlordId = null) {
        $query = "SELECT 
                    COUNT(*) as total_transactions,
                    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
                    SUM(CASE WHEN status = 'completed' AND DATE(created_at) = CURDATE() THEN amount ELSE 0 END) as today_revenue,
                    SUM(CASE WHEN status = 'completed' AND YEARWEEK(created_at) = YEARWEEK(NOW()) THEN amount ELSE 0 END) as week_revenue,
                    SUM(CASE WHEN status = 'completed' AND MONTH(created_at) = MONTH(NOW()) THEN amount ELSE 0 END) as month_revenue
                 FROM " . $this->table . "
                 WHERE 1=1";
        
        $params = [];
        if ($landlordId) {
            $query .= " AND landlord_id = ?";
            $params[] = $landlordId;
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetch();
    }
}
