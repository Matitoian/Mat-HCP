<?php
/**
 * M-PESA STK Push (Lipa Na M-PESA Online)
 * POST /api/mpesa/stk-push.php
 */

require_once '../../config/config.php';
require_once '../../models/PaymentTransaction.php';
require_once '../../middleware/auth.php';
require_once '../../utils/MPesa.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

// Authenticate user
$auth = authenticate();
if (!$auth) {
    errorResponse('Unauthorized', 401);
}

$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
if (!isset($data['phoneNumber']) || !isset($data['amount']) || !isset($data['propertyId'])) {
    errorResponse('Phone number, amount, and property ID are required');
}

$phoneNumber = preg_replace('/[^0-9]/', '', $data['phoneNumber']);
$amount = floatval($data['amount']);
$propertyId = $data['propertyId'];
$paymentType = isset($data['paymentType']) ? $data['paymentType'] : 'rent';

// Validate phone number (Kenyan format)
if (!preg_match('/^(254|0)[17]\d{8}$/', $phoneNumber)) {
    errorResponse('Invalid Kenyan phone number format');
}

// Convert to international format
if (substr($phoneNumber, 0, 1) === '0') {
    $phoneNumber = '254' . substr($phoneNumber, 1);
}

// Validate amount
if ($amount < 1) {
    errorResponse('Amount must be greater than 0');
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $payment = new PaymentTransaction($db);

    // Get property details
    $stmt = $db->prepare("SELECT landlord_id FROM properties WHERE id = ?");
    $stmt->execute([$propertyId]);
    $property = $stmt->fetch();

    if (!$property) {
        errorResponse('Property not found', 404);
    }

    // Create payment transaction record
    $transactionId = generateUUID();
    $paymentId = $payment->create([
        'transaction_id' => $transactionId,
        'property_id' => $propertyId,
        'tenant_id' => $auth['user_id'],
        'landlord_id' => $property['landlord_id'],
        'amount' => $amount,
        'payment_type' => $paymentType,
        'payment_method' => 'mpesa',
        'mpesa_phone' => $phoneNumber,
        'status' => 'pending'
    ]);

    // Initialize M-PESA STK Push
    $mpesa = new MPesa();
    $result = $mpesa->stkPush([
        'phone' => $phoneNumber,
        'amount' => $amount,
        'accountReference' => $transactionId,
        'transactionDesc' => "HouseCom Rent Payment"
    ]);

    if (!$result['success']) {
        // Update payment status to failed
        $payment->updateStatus($paymentId, 'failed');
        errorResponse($result['message'], 400);
    }

    // Update payment with M-PESA checkout request ID
    $payment->updateCheckoutRequestId($paymentId, $result['CheckoutRequestID']);

    jsonResponse([
        'success' => true,
        'message' => 'Payment initiated. Please enter your M-PESA PIN on your phone.',
        'data' => [
            'paymentId' => $paymentId,
            'checkoutRequestId' => $result['CheckoutRequestID'],
            'merchantRequestId' => $result['MerchantRequestID']
        ]
    ]);

} catch (Exception $e) {
    error_log("STK Push error: " . $e->getMessage());
    errorResponse('Payment initiation failed', 500);
}
