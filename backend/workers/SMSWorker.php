<?php
/**
 * SMS Worker - Phase 3: Async SMS Processing
 * Processes SMS messages from RabbitMQ queue
 * 
 * Run as: php backend/workers/SMSWorker.php &
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/MPesa.php';

class SMSWorker
{
    private $queueFile;
    private $mpesa;
    private $logger;

    public function __construct()
    {
        $this->queueFile = '/tmp/housecom_sms_queue.json';
        $this->mpesa = new MPesa();
        $this->logger = fopen('/var/log/housecom/sms_worker.log', 'a');

        if (!$this->logger) {
            $this->logger = STDOUT;
        }

        $this->log("SMS Worker started");
    }

    public function start()
    {
        while (true) {
            try {
                $this->processQueue();
                sleep(1); // Check queue every second
            } catch (Exception $e) {
                $this->log("Error: " . $e->getMessage());
                sleep(5); // Back off on error
            }
        }
    }

    private function processQueue()
    {
        if (file_exists($this->queueFile)) {
            $queue = json_decode(file_get_contents($this->queueFile), true) ?? [];

            if (!empty($queue)) {
                $message = array_shift($queue);
                $this->handleSMS($message);
                file_put_contents($this->queueFile, json_encode($queue));
            }
        }
    }

    private function handleSMS($data)
    {
        try {
            $this->log("Processing SMS: " . json_encode($data));

            $phone = $data['phone'] ?? null;
            $message = $data['message'] ?? null;
            $event = $data['event'] ?? null;

            if (!$phone || !$message) {
                $this->log("Invalid SMS data");
                return;
            }

            switch ($event) {
                case 'user.signup':
                    $this->sendSignupSMS($phone, $data['code'] ?? '');
                    break;

                case 'payment.completed':
                    $this->sendPaymentSMS($phone, $data['amount'] ?? 0, $data['property'] ?? '');
                    break;

                case 'property.verified':
                    $this->sendPropertyVerifiedSMS($phone, $data['property'] ?? '');
                    break;

                default:
                    $this->sendGenericSMS($phone, $message);
            }

            $this->log("SMS processed successfully");

        } catch (Exception $e) {
            $this->log("Error handling SMS: " . $e->getMessage());
        }
    }

    private function sendSignupSMS($phone, $code)
    {
        $message = "Welcome to HouseCom! Your verification code is: $code. Valid for 10 minutes.";
        $this->sendSMS($phone, $message);
    }

    private function sendPaymentSMS($phone, $amount, $property)
    {
        $message = "Payment of KShs $amount received for $property. Thank you!";
        $this->sendSMS($phone, $message);
    }

    private function sendPropertyVerifiedSMS($phone, $property)
    {
        $message = "Your property '$property' has been verified on HouseCom! Tenants can now see it.";
        $this->sendSMS($phone, $message);
    }

    private function sendGenericSMS($phone, $message)
    {
        $this->sendSMS($phone, $message);
    }

    private function sendSMS($phone, $message)
    {
        // Use MPesa/Africa's Talking or other SMS provider
        $result = $this->mpesa->sendSMS($phone, $message);

        if ($result['success'] ?? false) {
            $this->log("SMS sent to: $phone");
        } else {
            $this->log("Failed to send SMS to: $phone - " . ($result['error'] ?? 'Unknown error'));
        }
    }

    private function log($message)
    {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] [SMSWorker] $message\n";
        fwrite($this->logger, $logMessage);
        fflush($this->logger);
        echo $logMessage;
    }

    public function __destruct()
    {
        if ($this->logger && $this->logger !== STDOUT) {
            fclose($this->logger);
        }
    }
}

// Signal handlers
pcntl_signal(SIGTERM, function () {
    global $worker;
    $worker->log("Shutting down");
    exit(0);
});

$worker = new SMSWorker();
$worker->start();
