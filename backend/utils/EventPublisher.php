<?php
/**
 * Event Publisher for RabbitMQ Integration
 * Handles publishing events to message queues for async processing
 * Phase 3: Microservices Architecture
 */

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use PhpAmqpLib\Wire\AMQPTable;

class EventPublisher
{
    private static $connection;
    private static $channel;
    private static $connected = false;

    /**
     * Establish connection to RabbitMQ
     */
    public static function connect()
    {
        if (self::$connected && self::$channel) {
            return self::$channel;
        }

        try {
            $host = $_ENV['RABBITMQ_HOST'] ?? 'localhost';
            $port = (int)($_ENV['RABBITMQ_PORT'] ?? 5672);
            $user = $_ENV['RABBITMQ_USER'] ?? 'housecom';
            $password = $_ENV['RABBITMQ_PASSWORD'] ?? 'password';
            $vhost = $_ENV['RABBITMQ_VHOST'] ?? 'housecom';

            self::$connection = new AMQPStreamConnection(
                $host,
                $port,
                $user,
                $password,
                $vhost,
                false, // insist
                'AMQPLAIN',
                null,
                'en_US',
                30, // connection_timeout
                30  // read_write_timeout
            );

            self::$channel = self::$connection->channel();
            self::$connected = true;

            error_log("RabbitMQ connected successfully on {$host}:{$port}");
            return self::$channel;

        } catch (Exception $e) {
            error_log("RabbitMQ connection failed: " . $e->getMessage());
            self::$connected = false;
            return null;
        }
    }

    /**
     * Declare exchange and queue bindings
     */
    private static function declareExchangeAndQueue($exchangeName, $queueName, $routingKey, $exchangeType = 'topic')
    {
        try {
            $channel = self::connect();
            if (!$channel) return false;

            // Declare exchange
            $channel->exchange_declare(
                $exchangeName,
                $exchangeType,
                false, // passive
                true,  // durable
                false  // auto_delete
            );

            // Declare queue with priority support
            $channel->queue_declare(
                $queueName,
                false, // passive
                true,  // durable
                false, // exclusive
                false, // auto_delete
                false, // nowait
                new AMQPTable([
                    'x-max-priority' => ['I', 10],
                    'x-message-ttl' => ['I', 86400000] // 24 hours
                ])
            );

            // Bind queue to exchange
            $channel->queue_bind($queueName, $exchangeName, $routingKey);

            return true;

        } catch (Exception $e) {
            error_log("Queue declaration failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Publish event to specific queue
     * 
     * @param string $exchangeName Exchange name
     * @param string $routingKey Routing key
     * @param array $data Event data
     * @param int $priority Message priority (0-10)
     * @param array $metadata Additional metadata
     */
    public static function publish($exchangeName, $routingKey, $data, $priority = 5, $metadata = [])
    {
        try {
            $channel = self::connect();
            if (!$channel) {
                error_log("Cannot publish: RabbitMQ not connected");
                return false;
            }

            // Ensure exchange exists
            $channel->exchange_declare(
                $exchangeName,
                'topic',
                false,
                true,
                false
            );

            // Prepare message properties
            $properties = [
                'content_type' => 'application/json',
                'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT,
                'priority' => $priority,
                'timestamp' => time(),
                'headers' => new AMQPTable([
                    'x_trace_id' => $_SERVER['HTTP_X_TRACE_ID'] ?? uniqid(),
                    'x_user_id' => $metadata['user_id'] ?? null,
                    'x_timestamp' => date('c')
                ])
            ];

            // Create message
            $message = new AMQPMessage(
                json_encode($data),
                $properties
            );

            // Publish
            $channel->basic_publish($message, $exchangeName, $routingKey);

            error_log("Event published: {$exchangeName}.{$routingKey}");
            return true;

        } catch (Exception $e) {
            error_log("Failed to publish event: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Publish event to user-specific queue
     * Format: {exchange}.user.{user_id}
     */
    public static function publishToUser($exchangeName, $userId, $data, $priority = 5)
    {
        $routingKey = "user.{$userId}";
        return self::publish($exchangeName, $routingKey, $data, $priority, ['user_id' => $userId]);
    }

    /**
     * Publish batch events (for bulk operations)
     */
    public static function publishBatch($events, $maxRetries = 3)
    {
        $channel = self::connect();
        if (!$channel) {
            error_log("Cannot publish batch: RabbitMQ not connected");
            return ['total' => count($events), 'success' => 0, 'failed' => count($events)];
        }

        $successCount = 0;
        $failedCount = 0;
        $retries = 0;

        foreach ($events as $index => $event) {
            try {
                if (!isset($event['exchange'], $event['routing_key'], $event['data'])) {
                    error_log("Invalid event at index $index: missing required fields");
                    $failedCount++;
                    continue;
                }

                // Ensure exchange exists
                $channel->exchange_declare(
                    $event['exchange'],
                    'topic',
                    false,
                    true,
                    false
                );

                $message = new AMQPMessage(
                    json_encode($event['data']),
                    [
                        'content_type' => 'application/json',
                        'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT,
                        'priority' => $event['priority'] ?? 5,
                        'timestamp' => time()
                    ]
                );

                $channel->basic_publish(
                    $message,
                    $event['exchange'],
                    $event['routing_key']
                );

                $successCount++;

            } catch (Exception $e) {
                error_log("Batch publish failed at index $index: " . $e->getMessage());
                $failedCount++;

                // Retry if under limit
                if ($retries < $maxRetries) {
                    $retries++;
                    sleep(pow(2, $retries)); // Exponential backoff
                }
            }
        }

        return [
            'total' => count($events),
            'success' => $successCount,
            'failed' => $failedCount
        ];
    }

    /**
     * Publish delayed event
     * Requires rabbitmq_delayed_message_exchange plugin
     */
    public static function publishDelayed($exchangeName, $routingKey, $data, $delayMs = 5000, $priority = 5)
    {
        try {
            $channel = self::connect();
            if (!$channel) return false;

            // Declare delayed exchange
            $channel->exchange_declare(
                $exchangeName . '_delayed',
                'x-delayed-message',
                false,
                true,
                false,
                false,
                new AMQPTable(['x-delayed-type' => 'topic'])
            );

            $message = new AMQPMessage(
                json_encode($data),
                [
                    'content_type' => 'application/json',
                    'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT,
                    'priority' => $priority,
                    'headers' => new AMQPTable(['x-delay' => $delayMs])
                ]
            );

            $channel->basic_publish($message, $exchangeName . '_delayed', $routingKey);

            error_log("Delayed event published: {$exchangeName} after {$delayMs}ms");
            return true;

        } catch (Exception $e) {
            error_log("Failed to publish delayed event: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get queue statistics
     */
    public static function getQueueStats($queueName)
    {
        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 
                "http://" . ($_ENV['RABBITMQ_HOST'] ?? 'localhost') . 
                ":15672/api/queues/%2Fhousecom/{$queueName}"
            );
            curl_setopt($ch, CURLOPT_USERPWD, 
                ($_ENV['RABBITMQ_USER'] ?? 'housecom') . ":" . 
                ($_ENV['RABBITMQ_PASSWORD'] ?? 'password')
            );
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            $response = curl_exec($ch);
            curl_close($ch);

            return json_decode($response, true);

        } catch (Exception $e) {
            error_log("Failed to get queue stats: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Close connection
     */
    public static function close()
    {
        try {
            if (self::$channel) {
                self::$channel->close();
            }
            if (self::$connection) {
                self::$connection->close();
            }
            self::$connected = false;
        } catch (Exception $e) {
            error_log("Error closing connection: " . $e->getMessage());
        }
    }

    /**
     * Test connection
     */
    public static function test()
    {
        $channel = self::connect();
        return $channel !== null;
    }
}

// Ensure connection is closed on script exit
register_shutdown_function([EventPublisher::class, 'close']);
