<?php
/**
 * M-PESA Integration Utility
 * Safaricom M-PESA Daraja API Integration
 */

class MPesa {
    private $consumerKey;
    private $consumerSecret;
    private $shortcode;
    private $passkey;
    private $callbackUrl;
    private $environment;
    private $baseUrl;

    public function __construct() {
        $this->consumerKey = MPESA_CONSUMER_KEY;
        $this->consumerSecret = MPESA_CONSUMER_SECRET;
        $this->shortcode = MPESA_SHORTCODE;
        $this->passkey = MPESA_PASSKEY;
        $this->callbackUrl = MPESA_CALLBACK_URL;
        $this->environment = MPESA_ENVIRONMENT;

        // Set base URL based on environment
        $this->baseUrl = ($this->environment === 'production')
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    // Get access token
    private function getAccessToken() {
        $url = $this->baseUrl . '/oauth/v1/generate?grant_type=client_credentials';
        
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, false);
        curl_setopt($curl, CURLOPT_USERPWD, $this->consumerKey . ':' . $this->consumerSecret);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        
        $result = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        
        curl_close($curl);

        if ($status !== 200) {
            error_log("M-PESA: Failed to get access token. Status: $status");
            return false;
        }

        $response = json_decode($result, true);
        return $response['access_token'] ?? false;
    }

    // Generate password for STK Push
    private function generatePassword($timestamp) {
        return base64_encode($this->shortcode . $this->passkey . $timestamp);
    }

    // STK Push (Lipa Na M-PESA Online)
    public function stkPush($data) {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return [
                'success' => false,
                'message' => 'Failed to authenticate with M-PESA'
            ];
        }

        $timestamp = date('YmdHis');
        $password = $this->generatePassword($timestamp);

        $url = $this->baseUrl . '/mpesa/stkpush/v1/processrequest';

        $postData = [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => (int)$data['amount'],
            'PartyA' => $data['phone'],
            'PartyB' => $this->shortcode,
            'PhoneNumber' => $data['phone'],
            'CallBackURL' => $this->callbackUrl,
            'AccountReference' => $data['accountReference'] ?? 'HouseCom',
            'TransactionDesc' => $data['transactionDesc'] ?? 'Payment'
        ];

        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken
        ]);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $result = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        
        curl_close($curl);

        $response = json_decode($result, true);

        // Log the request
        error_log("M-PESA STK Push: " . json_encode($response));

        if ($status === 200 && isset($response['ResponseCode']) && $response['ResponseCode'] == '0') {
            return [
                'success' => true,
                'message' => $response['CustomerMessage'],
                'CheckoutRequestID' => $response['CheckoutRequestID'],
                'MerchantRequestID' => $response['MerchantRequestID']
            ];
        }

        return [
            'success' => false,
            'message' => $response['errorMessage'] ?? 'Payment request failed',
            'response' => $response
        ];
    }

    // Query STK Push status
    public function stkPushQuery($checkoutRequestId) {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return [
                'success' => false,
                'message' => 'Failed to authenticate with M-PESA'
            ];
        }

        $timestamp = date('YmdHis');
        $password = $this->generatePassword($timestamp);

        $url = $this->baseUrl . '/mpesa/stkpushquery/v1/query';

        $postData = [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'CheckoutRequestID' => $checkoutRequestId
        ];

        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken
        ]);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $result = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        
        curl_close($curl);

        $response = json_decode($result, true);

        if ($status === 200) {
            return [
                'success' => true,
                'data' => $response
            ];
        }

        return [
            'success' => false,
            'message' => 'Query failed',
            'response' => $response
        ];
    }

    // C2B Register URL
    public function registerC2BUrl($validationUrl, $confirmationUrl) {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return false;
        }

        $url = $this->baseUrl . '/mpesa/c2b/v1/registerurl';

        $postData = [
            'ShortCode' => $this->shortcode,
            'ResponseType' => 'Completed',
            'ConfirmationURL' => $confirmationUrl,
            'ValidationURL' => $validationUrl
        ];

        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken
        ]);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        $result = curl_exec($curl);
        curl_close($curl);

        return json_decode($result, true);
    }
}
