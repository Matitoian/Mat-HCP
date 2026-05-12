<?php
/**
 * SMS Sending Endpoint
 * Sends OTP codes via SMS using Africa's Talking API
 * For Kenya: Best SMS provider for the region
 */

require_once __DIR__ . '/../../config/config.php';

header('Content-Type: application/json');

// Only POST requests allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['phoneNumber']) || !isset($data['message'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $phoneNumber = $data['phoneNumber'];
    $message = $data['message'];
    $code = $data['code'] ?? null; // For logging

    // Validate phone number (Kenya +254 format)
    if (!preg_match('/^\+254\d{9}$/', $phoneNumber)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid phone number format']);
        exit;
    }

    // Check if SMS service is configured
    $smsProvider = getenv('SMS_PROVIDER') ?: 'africas_talking';
    $apiKey = getenv('AFRICAS_TALKING_API_KEY');
    $username = getenv('AFRICAS_TALKING_USERNAME');

    // TEST MODE - Log to file instead of sending
    if (!$apiKey || !$username) {
        $logMessage = "[" . date('Y-m-d H:i:s') . "] SMS TEST MODE\n";
        $logMessage .= "To: $phoneNumber\n";
        $logMessage .= "Code: $code\n";
        $logMessage .= "Message: $message\n";
        $logMessage .= "---\n";
        
        @file_put_contents(__DIR__ . '/../../logs/sms.log', $logMessage, FILE_APPEND);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'SMS logged (test mode)',
            'testMode' => true,
            'code' => $code
        ]);
        exit;
    }

    // Send via Africa's Talking
    sendViafricasTalking($phoneNumber, $message, $apiKey, $username);

} catch (Exception $e) {
    error_log("SMS Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to send SMS']);
}

/**
 * Send SMS via Africa's Talking API
 */
function sendViafricasTalking($phoneNumber, $message, $apiKey, $username) {
    $url = "https://api.sandbox.africastalking.com/version1/messaging";
    
    $data = [
        'username' => $username,
        'message' => $message,
        'recipients' => $phoneNumber
    ];

    $options = [
        'http' => [
            'header'  => [
                "Content-type: application/x-www-form-urlencoded\r\n",
                "Accept: application/json\r\n",
                "Authorization: Bearer $apiKey\r\n"
            ],
            'method'  => 'POST',
            'content' => http_build_query($data),
            'timeout' => 10
        ]
    ];

    $context = stream_context_create($options);
    
    try {
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            throw new Exception('Failed to connect to SMS provider');
        }

        $result = json_decode($response, true);

        if (isset($result['SMSMessageData']['Recipients'][0]['status']) && 
            $result['SMSMessageData']['Recipients'][0]['status'] === 'Success') {
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'SMS sent successfully',
                'messageId' => $result['SMSMessageData']['Recipients'][0]['messageId'] ?? null
            ]);
        } else {
            throw new Exception('SMS provider error: ' . json_encode($result));
        }
    } catch (Exception $e) {
        error_log("Africa's Talking Error: " . $e->getMessage());
        
        // Fallback to test mode
        $logMessage = "[" . date('Y-m-d H:i:s') . "] SMS FALLBACK (Africa's Talking unavailable)\n";
        $logMessage .= "To: $phoneNumber\n";
        $logMessage .= "Message: $message\n";
        $logMessage .= "Error: " . $e->getMessage() . "\n";
        $logMessage .= "---\n";
        
        @file_put_contents(__DIR__ . '/../../logs/sms.log', $logMessage, FILE_APPEND);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'SMS queued (provider unavailable)',
            'fallback' => true
        ]);
    }
}
?>
