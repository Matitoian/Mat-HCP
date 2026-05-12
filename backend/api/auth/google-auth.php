<?php
/**
 * Google OAuth Authentication
 * POST /api/auth/google-auth.php
 */

require_once '../../config/config.php';
require_once '../../models/User.php';
require_once '../../utils/JWT.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['token'])) {
    errorResponse('Google token is required');
}

$googleToken = $data['token'];

try {
    // Verify Google token
    $ch = curl_init('https://oauth2.googleapis.com/tokeninfo?id_token=' . $googleToken);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        errorResponse('Invalid Google token', 401);
    }

    $googleData = json_decode($response, true);

    // Verify audience (client ID)
    if ($googleData['aud'] !== GOOGLE_CLIENT_ID) {
        errorResponse('Invalid token audience', 401);
    }

    $email = $googleData['email'];
    $fullName = $googleData['name'];
    $googleId = $googleData['sub'];
    $profileImage = isset($googleData['picture']) ? $googleData['picture'] : null;

    $database = new Database();
    $db = $database->getConnection();
    $user = new User($db);

    // Check if user exists
    $userData = $user->getUserByEmail($email);

    if (!$userData) {
        // Create new user with Google auth
        $userId = $user->create([
            'email' => $email,
            'full_name' => $fullName,
            'google_id' => $googleId,
            'profile_image' => $profileImage,
            'auth_provider' => 'google',
            'role' => 'tenant', // Default role
            'verified' => true // Email verified by Google
        ]);

        $userData = $user->getUserById($userId);
    } else {
        // Update Google ID if not set
        if (empty($userData['google_id'])) {
            $user->updateGoogleId($userData['id'], $googleId);
        }
        
        // Update last login
        $user->updateLastLogin($userData['id']);
    }

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
        'message' => 'Google authentication successful',
        'token' => $token,
        'user' => $userData
    ]);

} catch (Exception $e) {
    error_log("Google auth error: " . $e->getMessage());
    errorResponse('Google authentication failed', 500);
}
