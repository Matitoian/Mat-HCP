# HouseCom Backend Integration Guide

Complete guide to integrate the PHP/MySQL backend with your React frontend.

## 🎯 Quick Start

### 1. Backend Setup (5 minutes)

```bash
# Step 1: Create database
mysql -u root -p
CREATE DATABASE housecom_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Step 2: Import schema
cd backend
mysql -u root -p housecom_db < database/schema.sql

# Step 3: Configure database
# Edit backend/config/database.php with your MySQL credentials

# Step 4: Start server
php -S localhost:8000 -t backend/
```

### 2. Frontend Integration (10 minutes)

Create a new API service file in your React app:

```bash
touch /src/lib/apiService.ts
```

## 📡 API Service Implementation

### Create API Service (`/src/lib/apiService.ts`)

```typescript
const API_BASE_URL = 'http://localhost:8000/api';

// Token management
let authToken: string | null = localStorage.getItem('authToken');

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('authToken', token);
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('authToken');
};

// Base API call function
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Authentication APIs
export const authApi = {
  async register(userData: {
    email: string;
    password: string;
    fullName: string;
    role: 'tenant' | 'landlord';
    phone?: string;
    university?: string;
    studentId?: string;
  }) {
    const data = await apiCall('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async login(email: string, password: string) {
    const data = await apiCall('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async googleAuth(googleToken: string) {
    const data = await apiCall('/auth/google-auth.php', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  logout() {
    clearAuthToken();
  },
};

// Property APIs
export const propertyApi = {
  async getProperties(filters: {
    county?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    university?: string;
    verified?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    return apiCall(`/properties/list.php?${params}`);
  },

  async getPropertyById(id: string) {
    return apiCall(`/properties/get.php?id=${id}`);
  },

  async createProperty(propertyData: any) {
    return apiCall('/properties/create.php', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  async updateProperty(id: string, propertyData: any) {
    return apiCall('/properties/update.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...propertyData }),
    });
  },

  async deleteProperty(id: string) {
    return apiCall('/properties/delete.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  },
};

// Payment APIs
export const paymentApi = {
  async initiateMpesaPayment(data: {
    phoneNumber: string;
    amount: number;
    propertyId: string;
    paymentType: 'rent' | 'deposit' | 'maintenance';
  }) {
    return apiCall('/mpesa/stk-push.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPaymentHistory(limit = 20, offset = 0) {
    return apiCall(`/payments/history.php?limit=${limit}&offset=${offset}`);
  },
};

// Chat APIs
export const chatApi = {
  async sendMessage(receiverId: string, message: string, propertyId?: string) {
    return apiCall('/chat/send-message.php', {
      method: 'POST',
      body: JSON.stringify({ receiverId, message, propertyId }),
    });
  },

  async getMessages(userId: string) {
    return apiCall(`/chat/get-messages.php?userId=${userId}`);
  },

  async getChatList() {
    return apiCall('/chat/chat-list.php');
  },
};

// Review APIs
export const reviewApi = {
  async createReview(reviewData: {
    propertyId: string;
    rating: number;
    reviewText?: string;
    cleanlinessRating?: number;
    securityRating?: number;
    locationRating?: number;
    valueRating?: number;
  }) {
    return apiCall('/reviews/create.php', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  async getPropertyReviews(propertyId: string) {
    return apiCall(`/reviews/get.php?propertyId=${propertyId}`);
  },
};

// Fraud Report APIs
export const fraudApi = {
  async reportFraud(reportData: {
    reportedType: 'property' | 'user';
    propertyId?: string;
    userId?: string;
    reason: string;
    description?: string;
    evidenceUrls?: string[];
  }) {
    return apiCall('/fraud/report.php', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },
};

// Admin APIs
export const adminApi = {
  async getDashboardStats() {
    return apiCall('/admin/dashboard-stats.php');
  },

  async verifyProperty(propertyId: string) {
    return apiCall('/admin/verify-property.php', {
      method: 'POST',
      body: JSON.stringify({ propertyId }),
    });
  },

  async getAllUsers(filters?: any) {
    const params = new URLSearchParams(filters || {});
    return apiCall(`/admin/users.php?${params}`);
  },

  async suspendUser(userId: string) {
    return apiCall('/admin/suspend-user.php', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async getFraudReports(status?: string) {
    const params = status ? `?status=${status}` : '';
    return apiCall(`/admin/fraud-reports.php${params}`);
  },
};
```

## 🔄 Update Existing Components

### 1. Update Login Component

Replace mock login with real API:

```typescript
// /src/app/components/LoginPage.tsx
import { authApi } from '@/lib/apiService';
import { toast } from 'sonner';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await authApi.login(email, password);
    
    if (response.success) {
      // Store user data
      const userData = response.user;
      onLogin(userData);
      toast.success('Login successful!');
    }
  } catch (error: any) {
    toast.error(error.message || 'Login failed');
  } finally {
    setIsLoading(false);
  }
};
```

### 2. Update Registration Component

```typescript
// /src/app/components/RegisterPage.tsx
import { authApi } from '@/lib/apiService';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await authApi.register({
      email,
      password,
      fullName,
      role,
      phone,
      university: role === 'tenant' ? university : undefined,
      studentId: role === 'tenant' ? studentId : undefined,
    });

    if (response.success) {
      toast.success('Registration successful!');
      onLogin(response.user);
    }
  } catch (error: any) {
    toast.error(error.message || 'Registration failed');
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Update Search/Properties Component

```typescript
// /src/app/components/SearchPage.tsx
import { propertyApi } from '@/lib/apiService';
import { useState, useEffect } from 'react';

const [properties, setProperties] = useState([]);
const [loading, setLoading] = useState(false);

const fetchProperties = async () => {
  setLoading(true);
  try {
    const response = await propertyApi.getProperties({
      county: selectedCounty,
      type: selectedType,
      minPrice,
      maxPrice,
      bedrooms,
      verified: true,
      search: searchQuery,
      page: currentPage,
    });

    if (response.success) {
      setProperties(response.data);
      // Handle pagination
      setPagination(response.pagination);
    }
  } catch (error: any) {
    toast.error('Failed to load properties');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchProperties();
}, [selectedCounty, selectedType, currentPage]);
```

### 4. Update M-PESA Payment

```typescript
// /src/app/components/PaymentPage.tsx
import { paymentApi } from '@/lib/apiService';

const handlePayment = async () => {
  setIsProcessing(true);

  try {
    const response = await paymentApi.initiateMpesaPayment({
      phoneNumber: formatPhoneNumber(phoneNumber), // 254712345678
      amount: parseFloat(amount),
      propertyId: selectedProperty.id,
      paymentType: 'rent',
    });

    if (response.success) {
      toast.success(response.message);
      // Poll for payment status or wait for callback
      setTimeout(() => checkPaymentStatus(response.data.paymentId), 5000);
    }
  } catch (error: any) {
    toast.error(error.message || 'Payment initiation failed');
  } finally {
    setIsProcessing(false);
  }
};
```

### 5. Update Chat Component

```typescript
// /src/app/components/ChatPage.tsx
import { chatApi } from '@/lib/apiService';

const fetchMessages = async () => {
  if (!selectedContact) return;

  try {
    const response = await chatApi.getMessages(selectedContact.id);
    if (response.success) {
      setMessages(response.data);
    }
  } catch (error: any) {
    toast.error('Failed to load messages');
  }
};

const handleSendMessage = async () => {
  if (!newMessage.trim() || !selectedContact) return;

  try {
    const response = await chatApi.sendMessage(
      selectedContact.id,
      newMessage,
      currentPropertyId
    );

    if (response.success) {
      setMessages([...messages, response.data]);
      setNewMessage('');
    }
  } catch (error: any) {
    toast.error('Failed to send message');
  }
};
```

## 🔐 Environment Variables

Create `.env.local` in your React app:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Update API service:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

## 🧪 Testing the Integration

### Test Authentication Flow

```bash
# 1. Start backend
cd backend
php -S localhost:8000

# 2. Start frontend (in new terminal)
npm run dev

# 3. Test registration
# Go to http://localhost:3000 and register a new account

# 4. Check database
mysql -u root -p housecom_db
SELECT * FROM users;
```

### Test M-PESA Integration

1. Use sandbox credentials in `backend/config/config.php`
2. Test phone number: `254708374149`
3. Initiate payment from frontend
4. Check M-PESA callback logs: `backend/logs/mpesa_callback_*.log`

## 🚀 Production Deployment

### Backend (PHP/MySQL)

1. **Set up production server** (VPS/Shared Hosting)
2. **Upload backend files** via FTP/SSH
3. **Import database schema**
4. **Update config files** with production credentials
5. **Set file permissions**
6. **Enable HTTPS** (Let's Encrypt)
7. **Update CORS** to allow only your frontend domain

### Frontend (React)

Update API URL in production:

```typescript
// .env.production
VITE_API_BASE_URL=https://api.housecom.co.ke/api
```

Build and deploy:

```bash
npm run build
# Deploy dist/ folder to Vercel/Netlify/etc
```

## 📊 Database Backup

```bash
# Backup database
mysqldump -u root -p housecom_db > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u root -p housecom_db < backup_20240307.sql
```

## 🔧 Troubleshooting

### CORS Issues

If you get CORS errors, ensure:
1. Backend `.htaccess` has CORS headers
2. Backend `config.php` has CORS headers
3. Frontend is making requests to correct URL

### Authentication Issues

If login fails:
1. Check JWT_SECRET is set in `config.php`
2. Verify database credentials
3. Check PHP error logs: `backend/logs/php_errors.log`

### M-PESA Issues

If STK Push fails:
1. Verify credentials in `config.php`
2. Check callback URL is publicly accessible
3. Review M-PESA logs: `backend/logs/mpesa_callback_*.log`
4. Test with sandbox credentials first

## 📞 Next Steps

1. ✅ Test all API endpoints
2. ✅ Replace mock data with real API calls
3. ✅ Implement error handling
4. ✅ Add loading states
5. ✅ Set up production environment
6. ✅ Configure M-PESA for production
7. ✅ Set up SSL certificates
8. ✅ Configure automated backups
9. ✅ Set up monitoring/logging
10. ✅ Prepare for TUM defense presentation

## 🎓 For TUM Defense

Your backend demonstrates:
- ✅ RESTful API architecture
- ✅ Secure authentication (JWT)
- ✅ Real payment integration (M-PESA)
- ✅ Database normalization
- ✅ Security best practices
- ✅ Scalable architecture
- ✅ Anti-fraud measures
- ✅ Complete CRUD operations

Good luck with your defense! 🚀
