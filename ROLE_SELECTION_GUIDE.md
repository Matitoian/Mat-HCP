# HouseCom - Role Selection Flow

## Overview
Users now choose their role (Tenant or Landlord) when they sign in or sign up. Admin accounts bypass this selection and go directly to the admin dashboard.

## Sign Up Flow

### Step 1: Register with Details
- Full name
- Email
- Phone number
- County preference
- Social login option

### Step 2: Choose Role
Users select one of two roles:
- **🏠 Tenant** - Looking for rental properties
- **🔑 Landlord** - Want to list properties

After selecting a role, they set their password and proceed.

### Step 3: Phone Verification (OTP)
- Verify phone number with 6-digit code
- **Automatically navigates to their dashboard based on selected role**

## Login Flow

### Step 1: Enter Credentials
- Email
- Password

### Step 2: Role Selection (if not admin)
After successful login:
- **Admin accounts** → Direct to Admin Dashboard
- **Regular users** → Choose Tenant or Landlord role

### Step 3: Navigate to Dashboard
Based on selected role:
- Tenant → Tenant Dashboard
- Landlord → Landlord Dashboard

## Admin Account

Admin account (`admin@housecom.co.ke`) is **special**:
- ✅ Bypasses role selection completely
- ✅ Goes directly to Admin Dashboard
- ✅ Cannot be changed to Tenant/Landlord role
- ✅ Has full platform access

## Role Definitions

### Tenant Role
- 🔍 Search for properties
- ❤️ Save favorite properties
- 💬 Chat with landlords
- 💳 Pay rent via M-PESA
- ⭐ Leave property reviews
- 📧 Request viewings

### Landlord Role
- 📝 Create property listings
- 📊 View tenant inquiries
- 💬 Chat with tenants
- 💰 Manage payments
- ⭐ View tenant ratings
- 📊 Analytics dashboard

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Tenant** | grace@example.com | password123 |
| **Landlord** | juma@example.com | password123 |
| **Admin** | admin@housecom.co.ke | password123 |

When logging in with Tenant or Landlord accounts, you'll see the role selection screen.
When logging in with Admin account, you'll go directly to the admin dashboard.

## Code Structure

### LoginPage.tsx
- **login state** - Email/password entry
- **role-selection state** - Choose role (skipped for admin)
- Admin check: `if (user.role === 'admin')` → Direct navigation

### SignupPage.tsx
- **Step 1** - Basic info + county
- **Step 2** - Role buttons + password + student verification

### OTPVerifyPage.tsx
- Verifies phone with OTP
- Navigates directly to dashboard (role already set from signup)

### App.tsx
- Reads `currentUser.role` to determine dashboard page
- No role selection needed in App

## Key Components

### LoginPage Features
```
✓ Two-step login for regular users
✓ Direct admin dashboard access
✓ Clear role icons (🏠 for Tenant, 🔑 for Landlord)
✓ Back button to switch roles
✓ Demo account quick-fill
```

### Benefits
1. **Clear user intent** - Users know what they're signing up for
2. **Admin protection** - Only admin account can access admin dashboard
3. **Streamlined experience** - No role changing after login
4. **Better UX** - Role-specific features immediately available
5. **Single dashboard access** - Users go directly to their role's dashboard

## What Changed

### Before
- Users logged in without selecting a role
- Role was determined from database
- Admin check was in App.tsx

### After
- Users select role on login/signup
- Admin accounts bypass role selection
- Role selection happens before dashboard navigation
- Clearer user intent and experience

---

**Status:** ✅ Implemented
**Date:** March 12, 2026
