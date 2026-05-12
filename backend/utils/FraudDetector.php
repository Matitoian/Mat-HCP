<?php
/**
 * Fraud Detection System - Phase 4
 * ML-based detection with scoring algorithm
 */

class FraudDetector
{
    private $riskThreshold = 0.7; // 70% risk threshold
    private $suspiciousPatterns = [];

    public function __construct()
    {
        // Load patterns from Redis if available
        $this->loadPatterns();
    }

    /**
     * Analyze transaction for fraud indicators
     */
    public function scoreTransaction($transaction)
    {
        $score = 0.0;
        $indicators = [];

        // 1. Velocity checks (40% weight)
        $velocityScore = $this->checkVelocity($transaction);
        $score += $velocityScore * 0.40;
        if ($velocityScore > 0.5) {
            $indicators[] = 'high_velocity_' . round($velocityScore * 100) . '%';
        }

        // 2. Amount anomaly (25% weight)
        $amountScore = $this->checkAmountAnomaly($transaction);
        $score += $amountScore * 0.25;
        if ($amountScore > 0.5) {
            $indicators[] = 'amount_anomaly';
        }

        // 3. Device fingerprinting (15% weight)
        $deviceScore = $this->checkDeviceFingerprint($transaction);
        $score += $deviceScore * 0.15;
        if ($deviceScore > 0.5) {
            $indicators[] = 'suspicious_device';
        }

        // 4. Geographic consistency (15% weight)
        $geoScore = $this->checkGeographic($transaction);
        $score += $geoScore * 0.15;
        if ($geoScore > 0.5) {
            $indicators[] = 'geographic_anomaly';
        }

        // 5. Account age check (5% weight)
        $accountScore = $this->checkAccountAge($transaction);
        $score += $accountScore * 0.05;
        if ($accountScore > 0.5) {
            $indicators[] = 'new_account';
        }

        return [
            'risk_score' => round($score, 2),
            'is_suspicious' => $score >= $this->riskThreshold,
            'indicators' => $indicators,
            'recommendation' => $this->getRecommendation($score, $transaction)
        ];
    }

    /**
     * Check transaction velocity (multiple transactions in short time)
     */
    private function checkVelocity($transaction)
    {
        $userId = $transaction['user_id'];
        $timeWindow = 3600; // 1 hour

        // Query recent transactions
        $query = "
            SELECT COUNT(*) as count 
            FROM payment_transactions 
            WHERE user_id = ? 
            AND created_at > NOW() - INTERVAL '1 hour'
        ";

        try {
            $db = Database::getInstance();
            $stmt = $db->prepare($query);
            $stmt->execute([$userId]);
            $result = $stmt->fetch();
            $transactionCount = $result['count'];

            // Risk increases with more transactions
            // 0-2 transactions: 0% risk
            // 3-5 transactions: 30% risk
            // 6-10 transactions: 70% risk
            // 10+ transactions: 100% risk
            if ($transactionCount <= 2) {
                return 0.0;
            } elseif ($transactionCount <= 5) {
                return 0.3;
            } elseif ($transactionCount <= 10) {
                return 0.7;
            } else {
                return 1.0;
            }
        } catch (Exception $e) {
            error_log("Velocity check error: " . $e->getMessage());
            return 0.0;
        }
    }

    /**
     * Detect unusual transaction amounts
     */
    private function checkAmountAnomaly($transaction)
    {
        $userId = $transaction['user_id'];
        $amount = (float)$transaction['amount'];

        // Get user's transaction history
        $query = "
            SELECT AVG(amount) as avg_amount, STDDEV(amount) as stddev_amount
            FROM payment_transactions
            WHERE user_id = ? AND created_at > NOW() - INTERVAL '30 days'
            AND status = 'completed'
        ";

        try {
            $db = Database::getInstance();
            $stmt = $db->prepare($query);
            $stmt->execute([$userId]);
            $result = $stmt->fetch();

            if (!$result['avg_amount']) {
                // New user - slight risk
                return 0.2;
            }

            $avgAmount = (float)$result['avg_amount'];
            $stddev = (float)$result['stddev_amount'];

            // Calculate z-score
            if ($stddev == 0) {
                $zScore = 0;
            } else {
                $zScore = abs(($amount - $avgAmount) / $stddev);
            }

            // Risk scoring based on z-score
            // Within 1 stddev: 0% risk
            // 1-2 stddev: 20% risk
            // 2-3 stddev: 50% risk
            // 3+ stddev: 90% risk
            if ($zScore <= 1) {
                return 0.0;
            } elseif ($zScore <= 2) {
                return 0.2;
            } elseif ($zScore <= 3) {
                return 0.5;
            } else {
                return 0.9;
            }
        } catch (Exception $e) {
            error_log("Amount anomaly check error: " . $e->getMessage());
            return 0.0;
        }
    }

    /**
     * Verify device fingerprint consistency
     */
    private function checkDeviceFingerprint($transaction)
    {
        $userId = $transaction['user_id'];
        $deviceId = $transaction['device_fingerprint'] ?? null;

        if (!$deviceId) {
            return 0.3; // Unknown device
        }

        // Check if device has been used before
        $query = "
            SELECT COUNT(*) as count
            FROM payment_transactions
            WHERE user_id = ? AND device_fingerprint = ?
            AND created_at > NOW() - INTERVAL '90 days'
        ";

        try {
            $db = Database::getInstance();
            $stmt = $db->prepare($query);
            $stmt->execute([$userId, $deviceId]);
            $result = $stmt->fetch();

            if ($result['count'] > 5) {
                return 0.0; // Trusted device (5+ transactions)
            } elseif ($result['count'] > 0) {
                return 0.1; // Known device
            } else {
                return 0.6; // New device
            }
        } catch (Exception $e) {
            error_log("Device fingerprint check error: " . $e->getMessage());
            return 0.3;
        }
    }

    /**
     * Geo-location consistency check
     */
    private function checkGeographic($transaction)
    {
        $userId = $transaction['user_id'];
        $currentLat = $transaction['latitude'] ?? null;
        $currentLon = $transaction['longitude'] ?? null;

        if (!$currentLat || !$currentLon) {
            return 0.3; // Unknown location
        }

        // Get last transaction location
        $query = "
            SELECT latitude, longitude, created_at
            FROM payment_transactions
            WHERE user_id = ? AND status = 'completed'
            ORDER BY created_at DESC LIMIT 1
        ";

        try {
            $db = Database::getInstance();
            $stmt = $db->prepare($query);
            $stmt->execute([$userId]);
            $lastTxn = $stmt->fetch();

            if (!$lastTxn) {
                return 0.2; // First transaction
            }

            $lastLat = (float)$lastTxn['latitude'];
            $lastLon = (float)$lastTxn['longitude'];
            $timeDiff = strtotime('now') - strtotime($lastTxn['created_at']);

            // Calculate distance using Haversine
            $distance = $this->haversineDistance($currentLat, $currentLon, $lastLat, $lastLon);

            // Estimate max possible travel speed (assume 120 km/h max)
            $maxDistance = ($timeDiff / 3600) * 120;

            if ($distance <= 1) {
                return 0.0; // Same location
            } elseif ($distance <= $maxDistance) {
                return 0.1; // Reasonable travel distance
            } else {
                return 0.9; // Impossible travel distance (impossible to travel that far in time)
            }
        } catch (Exception $e) {
            error_log("Geographic check error: " . $e->getMessage());
            return 0.2;
        }
    }

    /**
     * Check account age
     */
    private function checkAccountAge($transaction)
    {
        $userId = $transaction['user_id'];

        $query = "
            SELECT created_at FROM users WHERE id = ?
        ";

        try {
            $db = Database::getInstance();
            $stmt = $db->prepare($query);
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            if (!$user) {
                return 1.0; // User not found - very suspicious
            }

            $accountAgeDays = (strtotime('now') - strtotime($user['created_at'])) / 86400;

            // Risk decreases with account age
            // < 1 day: 80% risk
            // 1-7 days: 50% risk
            // 7-30 days: 20% risk
            // 30+ days: 0% risk
            if ($accountAgeDays < 1) {
                return 0.8;
            } elseif ($accountAgeDays < 7) {
                return 0.5;
            } elseif ($accountAgeDays < 30) {
                return 0.2;
            } else {
                return 0.0;
            }
        } catch (Exception $e) {
            error_log("Account age check error: " . $e->getMessage());
            return 0.3;
        }
    }

    /**
     * Get recommendation based on fraud score
     */
    private function getRecommendation($score, $transaction)
    {
        if ($score < 0.3) {
            return 'approve';
        } elseif ($score < 0.5) {
            return 'approve_with_monitoring';
        } elseif ($score < 0.7) {
            return 'request_verification'; // Challenge with OTP/2FA
        } else {
            return 'block_transaction';
        }
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private function haversineDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }

    /**
     * Load fraud patterns from cache
     */
    private function loadPatterns()
    {
        // Patterns could be:
        // - Known phishing domains
        // - Blocked email providers
        // - High-risk countries
        // - Blacklisted payment methods
        try {
            if (function_exists('apcu_fetch')) {
                $patterns = apcu_fetch('fraud_patterns');
                if ($patterns) {
                    $this->suspiciousPatterns = json_decode($patterns, true);
                }
            }
        } catch (Exception $e) {
            // Silent fail for cache ops
        }
    }

    /**
     * Report transaction as fraud (for model training)
     */
    public function reportFraud($transactionId, $reason)
    {
        try {
            $db = Database::getInstance();
            $query = "
                INSERT INTO fraud_reports (transaction_id, reason, created_at)
                VALUES (?, ?, NOW())
            ";
            $stmt = $db->prepare($query);
            $stmt->execute([$transactionId, $reason]);

            // Increment fraud counter for user
            $txnQuery = "SELECT user_id FROM payment_transactions WHERE id = ?";
            $txnStmt = $db->prepare($txnQuery);
            $txnStmt->execute([$transactionId]);
            $txn = $txnStmt->fetch();

            if ($txn) {
                $updateQuery = "
                    UPDATE users 
                    SET fraud_report_count = fraud_report_count + 1 
                    WHERE id = ?
                ";
                $updateStmt = $db->prepare($updateQuery);
                $updateStmt->execute([$txn['user_id']]);
            }

            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
