<?php
/**
 * Metrics Reporting Endpoint
 * Receives and logs performance metrics from frontend
 * For 2.5M users - critical for monitoring
 */

require_once __DIR__ . '/../../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        exit;
    }

    // Log metrics to file
    $logDir = __DIR__ . '/../../logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $metricsLog = $logDir . '/metrics.jsonl';
    $logEntry = json_encode([
        'timestamp' => $data['timestamp'] ?? time(),
        'summary' => $data['summary'] ?? [],
        'userAgent' => $data['userAgent'] ?? 'unknown',
    ]) . "\n";

    @file_put_contents($metricsLog, $logEntry, FILE_APPEND);

    // Alert if error rate is high
    if (isset($data['summary']['errorRate']) && (float)$data['summary']['errorRate'] > 10) {
        error_log("⚠️ HIGH ERROR RATE: {$data['summary']['errorRate']}%");
    }

    http_response_code(200);
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    error_log("Metrics Error: " . $e->getMessage());
    http_response_code(500);
}
?>
