# HouseCom Backend API Documentation

Complete PHP/MySQL backend for HouseCom - Coastal Kenya Rental Platform MVP

## 🎯 Overview

This backend provides all necessary APIs for:
- User authentication (Email, Google, Apple)
- Property management (CRUD operations)
- M-PESA payment integration
- Real-time chat messaging
- Dual rating systems (Property & Landlord)
- Fraud reporting and security
- Admin dashboard and management

## 📋 Requirements

- **PHP**: 7.4+ (8.0+ recommended)
- **MySQL**: 5.7+ or MariaDB 10.2+
- **Apache/Nginx**: with mod_rewrite enabled
- **Composer**: (optional, for dependencies)
- **cURL**: PHP extension enabled
- **OpenSSL**: PHP extension enabled

## 🚀 Installation

### 1. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE housecom_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Import schema
mysql -u root -p housecom_db < database/schema.sql
```

### 2. Configuration

Edit `/backend/config/database.php`:

```php
private $host = "localhost";
private $db_name = "housecom_db";
private $username = "your_db_username";
private $password = "your_db_password";
```

Edit `/backend/config/config.php` and update:

- **JWT_SECRET**: Change to a strong random secret
- **MPESA credentials**: Get from Safaricom Daraja Portal
- **Google OAuth**: Get from Google Cloud Console
- **Apple OAuth**: Get from Apple Developer Portal

### 3. File Permissions

```bash
# Create required directories
mkdir -p backend/uploads backend/logs

# Set permissions
chmod 755 backend/uploads
chmod 755 backend/logs
chmod 644 backend/config/*.php
```

### 4. Web Server Configuration

#### Apache (.htaccess)

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1 [L]

# Enable CORS
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
```

#### Nginx

```nginx
location /api/ {
    try_files $uri $uri/ /api/index.php?$query_string;
    
    # CORS
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
}
```

## 📡 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register.php
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "tenant",
  "phone": "0712345678",
  "university": "TUM",
  "studentId": "TUM/2024/001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "tenant"
  }
}
```

#### Login
```http
POST /api/auth/login.php
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Google Authentication
```http
POST /api/auth/google-auth.php
Content-Type: application/json

{
  "token": "google_id_token_here"
}
```

### Properties

#### Get Properties List
```http
GET /api/properties/list.php?county=Mombasa&minPrice=5000&maxPrice=20000&verified=true&page=1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Modern 1BR Near TUM",
      "price": 12000,
      "county": "Mombasa",
      "location": "Nyali",
      "bedrooms": 1,
      "bathrooms": 1,
      "verified": true,
      "images": ["url1", "url2"],
      "landlord_name": "Jane Doe",
      "avg_rating": 4.5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Create Property (Landlord Only)
```http
POST /api/properties/create.php
Authorization: Bearer <landlord_token>
Content-Type: application/json

{
  "title": "Modern 2BR Apartment",
  "description": "Spacious apartment near TUM",
  "propertyType": "2br",
  "price": 18000,
  "county": "Mombasa",
  "location": "Bamburi",
  "bedrooms": 2,
  "bathrooms": 2,
  "universityName": "TUM",
  "distanceToUni": 2.5,
  "amenities": ["WiFi", "Water", "Parking"],
  "askari24hr": true,
  "cctv": true,
  "fence": true,
  "compoundType": "Gated",
  "mpesaTill": "123456",
  "images": ["url1", "url2", "url3"]
}
```

### M-PESA Payments

#### Initiate STK Push
```http
POST /api/mpesa/stk-push.php
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "254712345678",
  "amount": 12000,
  "propertyId": "property_uuid",
  "paymentType": "rent"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated. Please enter your M-PESA PIN on your phone.",
  "data": {
    "paymentId": "payment_uuid",
    "checkoutRequestId": "ws_CO_123456789",
    "merchantRequestId": "12345-67890-1"
  }
}
```

### Chat

#### Send Message
```http
POST /api/chat/send-message.php
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": "landlord_uuid",
  "message": "Is this property still available?",
  "propertyId": "property_uuid"
}
```

#### Get Messages
```http
GET /api/chat/get-messages.php?userId=landlord_uuid
Authorization: Bearer <token>
```

### Reviews

#### Create Review
```http
POST /api/reviews/create.php
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyId": "property_uuid",
  "rating": 5,
  "reviewText": "Excellent property, very clean and secure",
  "cleanlinessRating": 5,
  "securityRating": 5,
  "locationRating": 4,
  "valueRating": 5
}
```

### Fraud Reports

#### Report Fraud
```http
POST /api/fraud/report.php
Authorization: Bearer <token>
Content-Type: application/json

{
  "reportedType": "property",
  "propertyId": "property_uuid",
  "reason": "fake_listing",
  "description": "Photos don't match actual property",
  "evidenceUrls": ["screenshot_url1", "screenshot_url2"]
}
```

### Admin Endpoints

#### Get Dashboard Statistics
```http
GET /api/admin/dashboard-stats.php
Authorization: Bearer <admin_token>
```

#### Verify Property
```http
POST /api/admin/verify-property.php
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "propertyId": "property_uuid"
}
```

## 🔐 M-PESA Integration Setup

### 1. Get Credentials from Safaricom

1. Go to [Daraja Portal](https://developer.safaricom.co.ke/)
2. Create an app
3. Get your Consumer Key and Consumer Secret
4. For sandbox testing, use test credentials
5. For production, apply for Go Live

### 2. Configure Credentials

In `/backend/config/config.php`:

```php
define('MPESA_CONSUMER_KEY', 'your_consumer_key');
define('MPESA_CONSUMER_SECRET', 'your_consumer_secret');
define('MPESA_SHORTCODE', 'your_paybill_number');
define('MPESA_PASSKEY', 'your_passkey');
define('MPESA_ENVIRONMENT', 'sandbox'); // or 'production'
```

### 3. Test STK Push

Use sandbox test numbers:
- Phone: 254708374149
- Amount: Any amount

### 4. Register Callback URL

Your callback URL must be publicly accessible:
```
https://yourdomain.com/api/mpesa/callback.php
```

For local testing, use ngrok:
```bash
ngrok http 80
# Use the ngrok URL in config
```

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Copy Client ID and Client Secret to `config.php`

## 🍎 Apple Sign In Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create an App ID with Sign In with Apple capability
3. Create a Service ID
4. Generate a private key
5. Configure in `config.php`

## 📊 Database Schema

### Main Tables

- **users**: User accounts (tenants, landlords, admins)
- **properties**: Property listings
- **property_images**: Property photos
- **property_reviews**: Property ratings and reviews
- **landlord_ratings**: Landlord ratings
- **chat_messages**: Chat conversations
- **payment_transactions**: M-PESA transactions
- **fraud_reports**: Fraud and scam reports
- **viewing_requests**: Property viewing appointments
- **matatu_routes**: Matatu transport routes

## 🔒 Security Features

### JWT Authentication
- Token-based authentication
- 24-hour expiration
- Secure signature verification

### Password Security
- Bcrypt hashing
- Minimum 8 characters
- Salt and pepper

### SQL Injection Prevention
- Prepared statements (PDO)
- Input sanitization
- Parameter binding

### XSS Prevention
- HTML special chars encoding
- Input validation
- Output escaping

### CORS Configuration
- Configurable origins
- Secure headers
- Pre-flight handling

## 🧪 Testing

### Test Admin Account
```
Email: admin@housecom.co.ke
Password: admin123
```

### API Testing with cURL

```bash
# Register
curl -X POST http://localhost/api/auth/register.php \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234","fullName":"Test User","role":"tenant"}'

# Login
curl -X POST http://localhost/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}'

# Get Properties
curl -X GET http://localhost/api/properties/list.php?county=Mombasa \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📱 Frontend Integration

Update your React frontend API calls:

```typescript
// /src/lib/api.ts
const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },
  
  async getProperties(filters: any) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/properties/list.php?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
};
```

## 🚀 Deployment

### Production Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Set database credentials
- [ ] Configure M-PESA production credentials
- [ ] Set up SSL/HTTPS
- [ ] Update CORS allowed origins
- [ ] Disable error display in PHP
- [ ] Enable error logging
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Set up monitoring/alerts

### Environment Variables (Production)

Use environment variables instead of hardcoded values:

```php
// config/database.php
$this->host = getenv('DB_HOST') ?: 'localhost';
$this->db_name = getenv('DB_NAME') ?: 'housecom_db';
$this->username = getenv('DB_USER');
$this->password = getenv('DB_PASS');
```

## 📞 Support

For issues or questions:
- GitHub: Create an issue
- Email: dev@housecom.co.ke

## 📄 License

Proprietary - HouseCom SMART Project
Technical University of Mombasa (TUM)
