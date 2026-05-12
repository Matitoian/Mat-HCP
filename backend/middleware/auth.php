<?php
/**
 * Authentication Middleware
 * Validates JWT token and authenticates user
 */

require_once __DIR__ . '/../utils/JWT.php';

function authenticate() {
    $headers = getallheaders();
    
    // Get token from Authorization header
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    
    if (!$authHeader) {
        return false;
    }

    // Extract token (format: "Bearer <token>")
    $token = null;
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
    }

    if (!$token) {
        return false;
    }

    // Verify and decode token
    $jwt = new JWT();
    $payload = $jwt->decode($token);

    if (!$payload) {
        return false;
    }

    // Return user data from token
    return $payload;
}

function requireAuth() {
    $auth = authenticate();
    if (!$auth) {
        errorResponse('Unauthorized. Please login.', 401);
    }
    return $auth;
}

function requireRole($role) {
    $auth = requireAuth();
    if ($auth['role'] !== $role) {
        errorResponse('Forbidden. Insufficient permissions.', 403);
    }
    return $auth;
}

function requireAdmin() {
    return requireRole('admin');
}

function requireLandlord() {
    return requireRole('landlord');
}

function requireTenant() {
    return requireRole('tenant');
}
