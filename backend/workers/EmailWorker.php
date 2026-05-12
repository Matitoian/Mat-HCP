<?php
/**
 * Email Worker - Phase 3: Async Processing
 * Processes emails from RabbitMQ queue
 * 
 * Run as: php backend/workers/EmailWorker.php &
 * Stop: pkill -f EmailWorker.php
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/EventPublisher.php';

// PHP AMQP should be installed
if (!extension_loaded('amqp') && !class_exists('\\PhpAmqpLib\\Connection\\AMQPStreamConnection')) {
    // Fallback: Use curl-based RabbitMQ connection
    error_log("AMQP not available, using file-based queue fallback");
}

class EmailWorker
{
    private $queueFile;
    private $running = true;
    private $logger;

    public function __construct()
    {
        $this->queueFile = '/tmp/housecom_email_queue.json';
        $this->logger = fopen('/var/log/housecom/email_worker.log', 'a');
        
        if (!$this->logger) {
            // Fallback to stdout
            $this->logger = STDOUT;
        }

        $this->log("Email Worker started");
    }

    public function start()
    {
        while ($this->running) {
            try {
                // Try to connect to RabbitMQ if available
                $this->processRabbitMQ();
            } catch (Exception $e) {
                // Fallback to file queue
                $this->processFileQueue();
            }

            // Prevent CPU spinning
            sleep(1);
        }
    }

    private function processRabbitMQ()
    {
        // Try RabbitMQ connection
        try {
            $host = $_ENV['RABBITMQ_HOST'] ?? 'localhost';
            $port = 5672;
            $user = $_ENV['RABBITMQ_USER'] ?? 'housecom';
            $pass = $_ENV['RABBITMQ_PASSWORD'] ?? 'password';

            // Connect and consume
            $connection = @new \PhpAmqpLib\Connection\AMQPStreamConnection($host, $port, $user, $pass);
            $channel = $connection->channel();

            $channel->queue_declare('email_queue', false, true, false, false);

            $this->log("Connected to RabbitMQ");

            $callback = function ($msg) {
                $this->handleMessage(json_decode($msg->body, true));
                $msg->ack();
            };

            $channel->basic_consume('email_queue', '', false, false, false, false, $callback);

            while (count($channel->callbacks)) {
                $channel->wait();
            }

        } catch (Exception $e) {
            $this->log("RabbitMQ connection failed: " . $e->getMessage());
            throw $e;
        }
    }

    private function processFileQueue()
    {
        // File-based queue fallback
        if (file_exists($this->queueFile)) {
            $queue = json_decode(file_get_contents($this->queueFile), true) ?? [];

            if (!empty($queue)) {
                $message = array_shift($queue);
                $this->handleMessage($message);

                // Update queue
                file_put_contents($this->queueFile, json_encode($queue));
            }
        }
    }

    private function handleMessage($data)
    {
        try {
            $this->log("Processing email: " . json_encode($data));

            switch ($data['event'] ?? null) {
                case 'user.signup':
                    $this->sendWelcomeEmail($data);
                    break;

                case 'payment.completed':
                    $this->sendPaymentConfirmation($data);
                    break;

                case 'user.password_reset':
                    $this->sendPasswordResetEmail($data);
                    break;

                case 'property.verified':
                    $this->sendPropertyVerifiedEmail($data);
                    break;

                default:
                    $this->log("Unknown event: {$data['event']}");
            }

            $this->log("Email processed successfully");

        } catch (Exception $e) {
            $this->log("Error handling email: " . $e->getMessage());
        }
    }

    private function sendWelcomeEmail($data)
    {
        $to = $data['email'] ?? null;
        if (!$to) return;

        $subject = "Welcome to HouseCom - Kenya's #1 Rental Platform";
        $body = $this->getWelcomeEmailTemplate($data['name'] ?? 'User');

        $this->sendMail($to, $subject, $body);
    }

    private function sendPaymentConfirmation($data)
    {
        $to = $data['email'] ?? null;
        if (!$to) return;

        $subject = "Payment Confirmation - HouseCom";
        $body = $this->getPaymentConfirmationTemplate(
            $data['amount'] ?? 0,
            $data['property_title'] ?? 'Your Property'
        );

        $this->sendMail($to, $subject, $body);
    }

    private function sendPasswordResetEmail($data)
    {
        $to = $data['email'] ?? null;
        if (!$to) return;

        $resetLink = $data['reset_link'] ?? '';
        $subject = "Reset Your HouseCom Password";
        $body = $this->getPasswordResetTemplate($resetLink);

        $this->sendMail($to, $subject, $body);
    }

    private function sendPropertyVerifiedEmail($data)
    {
        $to = $data['landlord_email'] ?? null;
        if (!$to) return;

        $subject = "Your Property Has Been Verified!";
        $body = $this->getPropertyVerifiedTemplate(
            $data['property_title'] ?? 'Your Property',
            $data['property_id'] ?? ''
        );

        $this->sendMail($to, $subject, $body);
    }

    private function sendMail($to, $subject, $body)
    {
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: noreply@housecom.co.ke\r\n";

        $result = mail($to, $subject, $body, $headers);

        if ($result) {
            $this->log("Email sent to: $to");
        } else {
            $this->log("Failed to send email to: $to");
        }
    }

    private function getWelcomeEmailTemplate($name)
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #007AFF; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { background-color: #007AFF; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to HouseCom!</h1>
        </div>
        <div class="content">
            <p>Hi $name,</p>
            <p>Thank you for joining HouseCom - Kenya's #1 rental platform serving Mombasa, Kilifi, Kwale, and Lamu.</p>
            <p>You now have access to:</p>
            <ul>
                <li>Search thousands of verified properties</li>
                <li>Connect directly with landlords via chat</li>
                <li>View property locations on interactive maps</li>
                <li>Check matatu routes near properties</li>
                <li>Secure payment options</li>
            </ul>
            <a href="https://housecom.co.ke/dashboard" class="button">Start Exploring</a>
            <p>Questions? Contact our support team at support@housecom.co.ke</p>
            <p>Best regards,<br>The HouseCom Team</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    private function getPaymentConfirmationTemplate($amount, $property)
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<body>
    <h2>Payment Confirmed</h2>
    <p>We've received your payment of KShs $amount for $property</p>
    <p>Your transaction is secure and verified.</p>
</body>
</html>
HTML;
    }

    private function getPasswordResetTemplate($link)
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<body>
    <h2>Reset Your Password</h2>
    <p>Click the link below to reset your HouseCom password:</p>
    <a href="$link">Reset Password</a>
    <p>This link expires in 24 hours.</p>
</body>
</html>
HTML;
    }

    private function getPropertyVerifiedTemplate($title, $propertyId)
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<body>
    <h2>Your Property is Verified!</h2>
    <p>Great news! Your property "$title" has been verified and is now live on HouseCom.</p>
    <p>Tenants can now see and contact you about this property.</p>
    <a href="https://housecom.co.ke/properties/$propertyId">View Property</a>
</body>
</html>
HTML;
    }

    private function log($message)
    {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] [EmailWorker] $message\n";
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
    $worker->log("Received SIGTERM, shutting down gracefully");
    exit(0);
});

pcntl_signal(SIGINT, function () {
    global $worker;
    $worker->log("Received SIGINT, shutting down gracefully");
    exit(0);
});

// Start worker
$worker = new EmailWorker();
$worker->start();
