<?php
/**
 * User Login API with Rate Limiting
 * POST /api/auth/login.php
 */

require_once '../../config/config.php';
require_once '../../models/User.php';
require_once '../../utils/JWT.php';
require_once '../../middleware/RateLimiter.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

// Apply rate limiting: 10 attempts per 15 minutes per email
try {
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($data['email'])) {
        $email = strtolower(trim($data['email']));
        applyRateLimit("login:$email", 10, 900);
    }
} catch (Exception $e) {
    // Rate limit exceeded - caught by applyRateLimit function
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email']) || !isset($data['password'])) {
    errorResponse('Email and password are required');
}

$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$password = $data['password'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    errorResponse('Invalid email format');
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $user = new User($db);

    // Get user by email
    $userData = $user->getUserByEmail($email);

    if (!$userData) {
        errorResponse('Invalid credentials', 401);
    }

    // Check if account is active
    if ($userData['status'] !== 'active') {
        errorResponse('Account is suspended or inactive', 403);
    }

    // Verify password
    if (!password_verify($password, $userData['password_hash'])) {
        errorResponse('Invalid credentials', 401);
    }

    // Update last login
    $user->updateLastLogin($userData['id']);

    // Generate JWT token
    $jwt = new JWT();
    $token = $jwt->encode([
        'user_id' => $userData['id'],
        'email' => $userData['email'],
        'role' => $userData['role'],
        'exp' => time() + JWT_EXPIRATION
    ]);

    // Remove sensitive data
    unset($userData['password_hash']);

    jsonResponse([
        'success' => true,
        'message' => 'Login successful',
        'token' => $token,
        'user' => $userData
    ]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    errorResponse('Login failed', 500);
}
