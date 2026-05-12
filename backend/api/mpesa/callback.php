<?php
/**
 * M-PESA Payment Callback
 * POST /api/mpesa/callback.php
 * Called by Safaricom when payment is completed
 */

require_once '../../config/config.php';
require_once '../../models/PaymentTransaction.php';

// Log callback data
$callbackData = file_get_contents('php://input');
file_put_contents(__DIR__ . '/../../logs/mpesa_callback_' . date('Y-m-d') . '.log', 
    date('Y-m-d H:i:s') . " - " . $callbackData . "\n", FILE_APPEND);

$data = json_decode($callbackData, true);

if (!$data) {
    error_log("Invalid M-PESA callback data");
    http_response_code(400);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $payment = new PaymentTransaction($db);

    // Extract callback data
    $resultCode = $data['Body']['stkCallback']['ResultCode'];
    $resultDesc = $data['Body']['stkCallback']['ResultDesc'];
    $checkoutRequestId = $data['Body']['stkCallback']['CheckoutRequestID'];

    // Find payment by checkout request ID
    $paymentRecord = $payment->getByCheckoutRequestId($checkoutRequestId);

    if (!$paymentRecord) {
        error_log("Payment not found for checkout request ID: " . $checkoutRequestId);
        http_response_code(404);
        exit();
    }

    if ($resultCode == 0) {
        // Payment successful
        $callbackMetadata = $data['Body']['stkCallback']['CallbackMetadata']['Item'];
        
        $mpesaReceiptNumber = '';
        $transactionDate = '';
        $phoneNumber = '';
        
        foreach ($callbackMetadata as $item) {
            if ($item['Name'] == 'MpesaReceiptNumber') {
                $mpesaReceiptNumber = $item['Value'];
            }
            if ($item['Name'] == 'TransactionDate') {
                $transactionDate = $item['Value'];
            }
            if ($item['Name'] == 'PhoneNumber') {
                $phoneNumber = $item['Value'];
            }
        }

        // Update payment status to completed
        $payment->update($paymentRecord['id'], [
            'status' => 'completed',
            'mpesa_receipt' => $mpesaReceiptNumber,
            'mpesa_phone' => $phoneNumber
        ]);

        // Send notification to tenant and landlord (implement later)
        // sendPaymentSuccessNotification($paymentRecord);

    } else {
        // Payment failed or cancelled
        $payment->updateStatus($paymentRecord['id'], 'failed');
        
        // Log failure reason
        error_log("M-PESA payment failed: " . $resultDesc);
    }

    // Acknowledge receipt
    http_response_code(200);
    echo json_encode(['ResultCode' => 0, 'ResultDesc' => 'Success']);

} catch (Exception $e) {
    error_log("M-PESA callback error: " . $e->getMessage());
    http_response_code(500);
}
