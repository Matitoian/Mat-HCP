<?php
/**
 * Property Model
 */

class Property {
    private $conn;
    private $table = 'properties';

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create property
    public function create($data) {
        $query = "INSERT INTO " . $this->table . " 
                 SET id = :id,
                     landlord_id = :landlord_id,
                     title = :title,
                     description = :description,
                     property_type = :property_type,
                     price = :price,
                     county = :county,
                     location = :location,
                     latitude = :latitude,
                     longitude = :longitude,
                     bedrooms = :bedrooms,
                     bathrooms = :bathrooms,
                     university_name = :university_name,
                     distance_to_uni = :distance_to_uni,
                     beach_distance = :beach_distance,
                     amenities = :amenities,
                     security_score = :security_score,
                     askari_24hr = :askari_24hr,
                     cctv = :cctv,
                     fence = :fence,
                     compound_type = :compound_type,
                     mpesa_till_number = :mpesa_till_number,
                     mpesa_paybill = :mpesa_paybill,
                     availability = :availability,
                     status = :status";

        $stmt = $this->conn->prepare($query);

        $id = generateUUID();
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':landlord_id', $data['landlord_id']);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':property_type', $data['property_type']);
        $stmt->bindParam(':price', $data['price']);
        $stmt->bindParam(':county', $data['county']);
        $stmt->bindParam(':location', $data['location']);
        $stmt->bindParam(':latitude', $data['latitude']);
        $stmt->bindParam(':longitude', $data['longitude']);
        $stmt->bindParam(':bedrooms', $data['bedrooms']);
        $stmt->bindParam(':bathrooms', $data['bathrooms']);
        $stmt->bindParam(':university_name', $data['university_name']);
        $stmt->bindParam(':distance_to_uni', $data['distance_to_uni']);
        $stmt->bindParam(':beach_distance', $data['beach_distance']);
        $stmt->bindParam(':amenities', $data['amenities']);
        $stmt->bindParam(':security_score', $data['security_score']);
        $stmt->bindParam(':askari_24hr', $data['askari_24hr'], PDO::PARAM_BOOL);
        $stmt->bindParam(':cctv', $data['cctv'], PDO::PARAM_BOOL);
        $stmt->bindParam(':fence', $data['fence'], PDO::PARAM_BOOL);
        $stmt->bindParam(':compound_type', $data['compound_type']);
        $stmt->bindParam(':mpesa_till_number', $data['mpesa_till_number']);
        $stmt->bindParam(':mpesa_paybill', $data['mpesa_paybill']);
        $availability = $data['availability'] ?? 'available';
        $stmt->bindParam(':availability', $availability);
        $stmt->bindParam(':status', $data['status']);

        if ($stmt->execute()) {
            return $id;
        }
        return false;
    }

    // Get properties with filters
    public function getProperties($filters = []) {
        $query = "SELECT p.*, 
                        u.full_name as landlord_name,
                        u.phone as landlord_phone,
                        u.verified as landlord_verified,
                        COUNT(DISTINCT pr.id) as review_count,
                        COALESCE(AVG(pr.rating), 0) as avg_rating
                 FROM " . $this->table . " p
                 LEFT JOIN users u ON p.landlord_id = u.id
                 LEFT JOIN property_reviews pr ON p.id = pr.property_id AND pr.status = 'approved'
                 WHERE 1=1";
        
        $params = [];

        if (isset($filters['county'])) {
            $query .= " AND p.county = ?";
            $params[] = $filters['county'];
        }

        if (isset($filters['property_type'])) {
            $query .= " AND p.property_type = ?";
            $params[] = $filters['property_type'];
        }

        if (isset($filters['min_price'])) {
            $query .= " AND p.price >= ?";
            $params[] = $filters['min_price'];
        }

        if (isset($filters['max_price'])) {
            $query .= " AND p.price <= ?";
            $params[] = $filters['max_price'];
        }

        if (isset($filters['bedrooms'])) {
            $query .= " AND p.bedrooms >= ?";
            $params[] = $filters['bedrooms'];
        }

        if (isset($filters['university'])) {
            $query .= " AND p.university_name LIKE ?";
            $params[] = '%' . $filters['university'] . '%';
        }

        if (isset($filters['verified'])) {
            $query .= " AND p.verified = ?";
            $params[] = $filters['verified'];
        }

        if (isset($filters['status'])) {
            $query .= " AND p.status = ?";
            $params[] = $filters['status'];
        }

        if (isset($filters['availability'])) {
            $query .= " AND p.availability = ?";
            $params[] = $filters['availability'];
        }

        if (isset($filters['landlord_id'])) {
            $query .= " AND p.landlord_id = ?";
            $params[] = $filters['landlord_id'];
        }

        if (isset($filters['search'])) {
            $query .= " AND (p.title LIKE ? OR p.description LIKE ? OR p.location LIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $query .= " GROUP BY p.id ORDER BY p.created_at DESC";

        if (isset($filters['limit']) && isset($filters['offset'])) {
            $query .= " LIMIT ? OFFSET ?";
            $params[] = (int)$filters['limit'];
            $params[] = (int)$filters['offset'];
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $properties = $stmt->fetchAll();

        // Get images for each property
        foreach ($properties as &$property) {
            $property['images'] = $this->getPropertyImages($property['id']);
            $property['amenities'] = json_decode($property['amenities'], true);
        }

        return $properties;
    }

    // Get property by ID
    public function getPropertyById($id) {
        $query = "SELECT p.*, 
                        u.full_name as landlord_name,
                        u.phone as landlord_phone,
                        u.email as landlord_email,
                        u.verified as landlord_verified,
                        COUNT(DISTINCT pr.id) as review_count,
                        COALESCE(AVG(pr.rating), 0) as avg_rating
                 FROM " . $this->table . " p
                 LEFT JOIN users u ON p.landlord_id = u.id
                 LEFT JOIN property_reviews pr ON p.id = pr.property_id AND pr.status = 'approved'
                 WHERE p.id = ?
                 GROUP BY p.id
                 LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        $property = $stmt->fetch();

        if ($property) {
            $property['images'] = $this->getPropertyImages($id);
            $property['amenities'] = json_decode($property['amenities'], true);
            
            // Increment views
            $this->incrementViews($id);
        }

        return $property;
    }

    // Get property images
    public function getPropertyImages($propertyId) {
        $query = "SELECT image_url FROM property_images 
                 WHERE property_id = ? 
                 ORDER BY display_order ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$propertyId]);
        $images = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return $images ?: [];
    }

    // Add images
    public function addImages($propertyId, $images) {
        $query = "INSERT INTO property_images (id, property_id, image_url, display_order) 
                 VALUES (?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);

        foreach ($images as $index => $imageUrl) {
            $id = generateUUID();
            $stmt->execute([$id, $propertyId, $imageUrl, $index]);
        }
        return true;
    }

    // Increment views
    private function incrementViews($propertyId) {
        $query = "UPDATE " . $this->table . " SET views_count = views_count + 1 WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$propertyId]);
    }

    // Update property
    public function update($propertyId, $data) {
        $fields = [];
        $values = [];

        $allowedFields = [
            'title', 'description', 'property_type', 'price', 'county', 'location',
            'latitude', 'longitude', 'bedrooms', 'bathrooms', 'university_name',
            'distance_to_uni', 'beach_distance', 'amenities', 'security_score',
            'askari_24hr', 'cctv', 'fence', 'compound_type', 'mpesa_till_number',
            'mpesa_paybill', 'availability', 'status', 'verified'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $values[] = $propertyId;
        $query = "UPDATE " . $this->table . " SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($values);
    }

    // Delete property
    public function delete($propertyId) {
        $query = "DELETE FROM " . $this->table . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$propertyId]);
    }

    // Verify property (admin)
    public function verifyProperty($propertyId, $adminId) {
        $query = "UPDATE " . $this->table . " 
                 SET verified = TRUE, 
                     verification_date = NOW(),
                     verified_by = ?,
                     status = 'active'
                 WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$adminId, $propertyId]);
    }

    // Get total count
    public function getTotalCount($filters = []) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table . " WHERE 1=1";
        $params = [];

        if (isset($filters['county'])) {
            $query .= " AND county = ?";
            $params[] = $filters['county'];
        }

        if (isset($filters['property_type'])) {
            $query .= " AND property_type = ?";
            $params[] = $filters['property_type'];
        }

        if (isset($filters['status'])) {
            $query .= " AND status = ?";
            $params[] = $filters['status'];
        }

        if (isset($filters['verified'])) {
            $query .= " AND verified = ?";
            $params[] = $filters['verified'];
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return $result['total'];
    }
}
