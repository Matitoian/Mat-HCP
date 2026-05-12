<?php
/**
 * HouseCom Application Configuration
 */

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Africa/Nairobi');

// CORS headers for API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Application settings
define('APP_NAME', 'HouseCom');
define('APP_URL', 'http://localhost:3000');
define('API_URL', 'http://localhost:8000');

// Supabase Configuration
define('SUPABASE_URL', 'https://zwbrhjofdggfjwsalrqt.supabase.co');
define('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3YnJoam9mZGdnZmp3c2FscnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTU5MTMsImV4cCI6MjA4ODg3MTkxM30.U9gCDhZkYbM0l2ur8f8Uol4Wj_etfD6lmfgIGwLH7VE');
define('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3YnJoam9mZGdnZmp3c2FscnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI5NTkxMywiZXhwIjoyMDg4ODcxOTEzfQ.I9Ct9rHpeatP696KcM5utPWWv3O4lGZVoqt8Ez129gk');
define('SUPABASE_SECRET_KEY', 'sb_secret_0CPYzZZX0gvchxk65Bw8og_WRFu40ea');
define('SUPABASE_PROJECT_ID', 'zwbrhjofdggfjwsalrqt');

// JWT settings
define('JWT_SECRET', 'your-secret-key-change-this-in-production');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 86400); // 24 hours

// M-PESA settings
define('MPESA_CONSUMER_KEY', 'YOUR_MPESA_CONSUMER_KEY');
define('MPESA_CONSUMER_SECRET', 'YOUR_MPESA_CONSUMER_SECRET');
define('MPESA_SHORTCODE', 'YOUR_SHORTCODE');
define('MPESA_PASSKEY', 'YOUR_PASSKEY');
define('MPESA_CALLBACK_URL', API_URL . '/api/mpesa/callback.php');
define('MPESA_ENVIRONMENT', 'sandbox'); // 'sandbox' or 'production'

// Google OAuth
define('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID');
define('GOOGLE_CLIENT_SECRET', 'YOUR_GOOGLE_CLIENT_SECRET');
define('GOOGLE_REDIRECT_URI', API_URL . '/api/auth/google-callback.php');

// Apple OAuth
define('APPLE_CLIENT_ID', 'YOUR_APPLE_CLIENT_ID');
define('APPLE_TEAM_ID', 'YOUR_APPLE_TEAM_ID');
define('APPLE_KEY_ID', 'YOUR_APPLE_KEY_ID');
define('APPLE_PRIVATE_KEY_PATH', __DIR__ . '/apple-private-key.p8');

// File upload settings
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE', 5242880); // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/jpg']);

// SMS settings (for OTP verification)
define('SMS_API_KEY', 'YOUR_SMS_API_KEY');
define('SMS_SENDER_ID', 'HOUSECOM');

// Email settings
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'your-email@gmail.com');
define('SMTP_PASSWORD', 'your-app-password');
define('SMTP_FROM_EMAIL', 'noreply@housecom.co.ke');
define('SMTP_FROM_NAME', 'HouseCom');

// Pagination
define('ITEMS_PER_PAGE', 20);

// Security
define('PASSWORD_MIN_LENGTH', 8);
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutes

// AI Chatbot (if using external service)
define('AI_API_KEY', 'YOUR_AI_API_KEY');
define('AI_API_ENDPOINT', 'https://api.openai.com/v1/chat/completions');

// Cloudinary (for image hosting - optional)
define('CLOUDINARY_CLOUD_NAME', 'YOUR_CLOUD_NAME');
define('CLOUDINARY_API_KEY', 'YOUR_API_KEY');
define('CLOUDINARY_API_SECRET', 'YOUR_API_SECRET');

// Include database configuration
require_once __DIR__ . '/database.php';

// Helper function for JSON response
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Helper function for error response
function errorResponse($message, $statusCode = 400) {
    jsonResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

// Helper function to generate UUID
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
