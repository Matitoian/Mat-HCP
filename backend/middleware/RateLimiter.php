<?php
/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and abuse
 * Uses sliding window algorithm
 */

class RateLimiter {
    private $redis;
    private $prefix = 'rate_limit:';

    public function __construct($redisConnection = null) {
        // If Redis is available, use it. Otherwise fall back to file-based
        $this->redis = $redisConnection;
    }

    /**
     * Check if request is allowed
     * @param string $identifier User IP, email, or ID
     * @param int $maxRequests Max requests allowed
     * @param int $windowSeconds Time window in seconds
     * @return array ['allowed' => bool, 'remaining' => int, 'resetTime' => int]
     */
    public function checkLimit($identifier, $maxRequests = 100, $windowSeconds = 60) {
        $key = $this->prefix . $identifier;
        $now = time();
        $windowStart = $now - $windowSeconds;

        if ($this->redis) {
            return $this->checkLimitRedis($key, $maxRequests, $windowSeconds, $now);
        } else {
            return $this->checkLimitFile($key, $maxRequests, $windowStart, $now);
        }
    }

    /**
     * Check rate limit using Redis (recommended)
     */
    private function checkLimitRedis($key, $maxRequests, $windowSeconds, $now) {
        // Increment counter
        $this->redis->incr($key);
        $count = $this->redis->get($key);

        // Set expiration on first request
        if ($count == 1) {
            $this->redis->expire($key, $windowSeconds);
        }

        $allowed = $count <= $maxRequests;
        $remaining = max(0, $maxRequests - $count);
        $resetTime = $now + $windowSeconds;

        return [
            'allowed' => $allowed,
            'remaining' => $remaining,
            'resetTime' => $resetTime,
            'retryAfter' => !$allowed ? ceil(($resetTime - $now)) : 0,
        ];
    }

    /**
     * Check rate limit using file-based storage (fallback)
     */
    private function checkLimitFile($key, $maxRequests, $windowStart, $now) {
        $file = sys_get_temp_dir() . '/rate_limit_' . md5($key) . '.json';
        $requests = [];

        // Load existing requests
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            // Filter out old requests outside the window
            $requests = array_filter($data['requests'] ?? [], function($time) use ($windowStart) {
                return $time > $windowStart;
            });
        }

        // Add current request
        $requests[] = $now;
        $count = count($requests);

        // Save updated requests
        @file_put_contents($file, json_encode(['requests' => $requests], JSON_PRETTY_PRINT));

        $allowed = $count <= $maxRequests;
        $remaining = max(0, $maxRequests - $count);
        $resetTime = min($requests) + 60; // Reset when oldest request expires

        return [
            'allowed' => $allowed,
            'remaining' => $remaining,
            'resetTime' => $resetTime,
            'retryAfter' => !$allowed ? ceil(($resetTime - $now)) : 0,
        ];
    }
}

/**
 * Middleware to apply rate limits to API endpoints
 */
function applyRateLimit($identifier, $maxRequests = 100, $windowSeconds = 60) {
    $limiter = new RateLimiter();
    $result = $limiter->checkLimit($identifier, $maxRequests, $windowSeconds);

    // Add headers
    header("X-RateLimit-Limit: $maxRequests");
    header("X-RateLimit-Remaining: {$result['remaining']}");
    header("X-RateLimit-Reset: {$result['resetTime']}");

    if (!$result['allowed']) {
        http_response_code(429);
        header("Retry-After: {$result['retryAfter']}");
        echo json_encode([
            'success' => false,
            'message' => 'Rate limit exceeded. Please try again later.',
            'retryAfter' => $result['retryAfter'],
        ]);
        exit;
    }

    return $result;
}

/**
 * Example rate limit rules
 */
return [
    'auth_signup' => [
        'maxRequests' => 3,
        'windowSeconds' => 3600, // 3 attempts per hour
        'identifier' => 'email', // Rate limit per email
    ],
    'auth_login' => [
        'maxRequests' => 10,
        'windowSeconds' => 900, // 10 attempts per 15 minutes
        'identifier' => 'email',
    ],
    'auth_forgot_password' => [
        'maxRequests' => 5,
        'windowSeconds' => 3600, // 5 attempts per hour
        'identifier' => 'email',
    ],
    'otp_verify' => [
        'maxRequests' => 10,
        'windowSeconds' => 3600, // 10 attempts per hour
        'identifier' => 'phone',
    ],
    'api_general' => [
        'maxRequests' => 1000,
        'windowSeconds' => 3600, // 1000 requests per hour
        'identifier' => 'ip', // Rate limit per IP
    ],
    'property_search' => [
        'maxRequests' => 100,
        'windowSeconds' => 60, // 100 requests per minute
        'identifier' => 'ip',
    ],
    'chat_send' => [
        'maxRequests' => 30,
        'windowSeconds' => 60, // 30 messages per minute
        'identifier' => 'user_id',
    ],
];
?>
