<?php
/**
 * HouseCom Database Configuration
 * MySQL Database Connection Settings
 */

class Database {
    private $host = "localhost";
    private $db_name = "housecom_db";
    private $username = "root";
    private $password = "";
    private $charset = "utf8mb4";
    public $conn;

    // Get database connection
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            throw new Exception("Database connection failed");
        }

        return $this->conn;
    }
}

// For production, use environment variables:
/*
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $charset = "utf8mb4";
    public $conn;

    public function __construct() {
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->db_name = getenv('DB_NAME') ?: 'housecom_db';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASS') ?: '';
    }

    public function getConnection() {
        // Same as above
    }
}
*/
