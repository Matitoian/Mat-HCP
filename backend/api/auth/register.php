<?php
/**
 * User Registration API with Rate Limiting
 * POST /api/auth/register.php
 */

require_once '../../config/config.php';
require_once '../../models/User.php';
require_once '../../utils/JWT.php';
require_once '../../middleware/RateLimiter.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

$data = json_decode(file_get_contents("php://input"), true);

// Apply rate limiting early: 3 signup attempts per hour per email
try {
    if (isset($data['email'])) {
        $checkEmail = strtolower(trim($data['email']));
        applyRateLimit("signup:$checkEmail", 3, 3600);
    }
} catch (Exception $e) {
    // Rate limit exceeded - caught by applyRateLimit function
}

// Validate required fields
$required = ['email', 'password', 'fullName', 'role'];
foreach ($required as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        errorResponse("Field '{$field}' is required");
    }
}

$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$password = $data['password'];
$fullName = htmlspecialchars(strip_tags($data['fullName']));
$role = $data['role'];
$phone = isset($data['phone']) ? htmlspecialchars(strip_tags($data['phone'])) : null;
$university = isset($data['university']) ? htmlspecialchars(strip_tags($data['university'])) : null;
$studentId = isset($data['studentId']) ? htmlspecialchars(strip_tags($data['studentId'])) : null;

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    errorResponse('Invalid email format');
}

// Validate password
if (strlen($password) < PASSWORD_MIN_LENGTH) {
    errorResponse('Password must be at least ' . PASSWORD_MIN_LENGTH . ' characters long');
}

// Validate role
if (!in_array($role, ['tenant', 'landlord'])) {
    errorResponse('Invalid role. Must be either tenant or landlord');
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $user = new User($db);

    // Check if email already exists
    if ($user->emailExists($email)) {
        errorResponse('Email already registered', 409);
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    // Create user
    $userId = $user->create([
        'email' => $email,
        'password_hash' => $passwordHash,
        'full_name' => $fullName,
        'role' => $role,
        'phone' => $phone,
        'university' => $university,
        'student_id' => $studentId,
        'auth_provider' => 'email'
    ]);

    if (!$userId) {
        errorResponse('Registration failed', 500);
    }

    // Get created user
    $userData = $user->getUserById($userId);

    // Generate JWT token
    $jwt = new JWT();
    $token = $jwt->encode([
        'user_id' => $userId,
        'email' => $email,
        'role' => $role,
        'exp' => time() + JWT_EXPIRATION
    ]);

    // Remove sensitive data
    unset($userData['password_hash']);

    jsonResponse([
        'success' => true,
        'message' => 'Registration successful',
        'token' => $token,
        'user' => $userData
    ], 201);

} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    errorResponse('Registration failed', 500);
}
