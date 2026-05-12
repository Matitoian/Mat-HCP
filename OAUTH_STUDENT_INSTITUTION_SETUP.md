# OAuth & Student Role Implementation - Setup Guide

## Overview
This guide covers the implementation of:
1. **Post-OAuth Role Selection** - Users select Tenant or Landlord after Google/Apple OAuth
2. **Student Status** - Tenants can mark themselves as students
3. **Institution Selection** - Students choose their school/university
4. **Institution-Based Filtering** - Properties shown near student's campus

---

## Issue: "Signup failed: TypeError: Failed to fetch"

### Root Cause
The OAuth error typically occurs due to one of:
1. **Missing Google OAuth Configuration** - Google Client ID/Secret not set in Supabase
2. **CORS Issues** - OAuth redirect URI not whitelisted
3. **Network/Backend Issues** - OAuth endpoint unreachable
4. **Supabase Disabled** - Google provider not enabled in Supabase dashboard

### Quick Fix Checklist

#### Step 1: Enable Google OAuth in Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (`zwbrhjofdggfjwsalrqt`)
3. Navigate to: **Authentication → Providers**
4. Click on **Google**
5. Toggle **Enabled**
6. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
7. Click **Save**

#### Step 2: Configure Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**:
   - APIs & Services → Library
   - Search "Google+ API"
   - Click → Enable
4. Create OAuth Credentials:
   - APIs & Services → Credentials
   - Create Credentials → OAuth Client ID
   - Application Type: **Web application**
   - Name: HouseCom
   - Authorized JavaScript origins:
     ```
     http://localhost:5173
     http://localhost:3000
     http://localhost:3001
     ```
   - Authorized redirect URIs:
     ```
     https://[project-id].supabase.co/auth/v1/callback
     https://[project-id].supabase.co/auth/v1/authorize/callback
     http://localhost:5173
     ```
5. Copy **Client ID** and **Client Secret**
6. Paste into Supabase (Step 1)

#### Step 3: Set Environment Variables
Create or update `.env.local`:
```env
VITE_SUPABASE_URL=https://zwbrhjofdggfjwsalrqt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

#### Step 4: Test the Fix
1. Restart dev server: `npm run dev`
2. Go to signup page
3. Click "Continue with Google"
4. You should see account selector modal (not error)
5. After OAuth redirect, select role and institution

---

## New Flow: OAuth → Role → Institution → Dashboard

### User Journey

```
User on SignupPage
    ↓
Clicks "Continue with Google"
    ↓
OAuthAccountSelector Modal appears
    ↓
User selects account (or uses different account)
    ↓
Redirected to Google login
    ↓
After authentication, redirected back to app
    ↓
App detects SIGNED_IN event
    ↓
User has no role yet
    ↓
[NEW] Navigate to OAuthProfileSetupPage
    ↓
RoleAndStudentSelector shows (Step 1)
    - Choose: Tenant or Landlord
    - If Tenant: Auto-show student checkbox
    ↓
If selected Landlord
    - Profile complete
    - Navigate to Landlord Dashboard
    ↓
If selected Tenant + Not Student
    - Profile complete  
    - Navigate to Tenant Dashboard
    ↓
If selected Tenant + Is Student
    - Show InstitutionSelector (Step 2)
    - Browse institutions by county
    - Select school/university
    - Can skip if institution not found
    ↓
Navigate to Tenant Dashboard
    - Dashboard shows institution badge
    - Listings filtered to institution's county
    - Student ID displayed if provided

```

---

## Components Added

### 1. **RoleAndStudentSelector** 
`src/app/components/RoleAndStudentSelector.tsx`

Displays:
- **Step 1**: Choose role (Tenant or Landlord)
  - Tenant card with benefits (search, save, message)
  - Landlord card with benefits (list, manage, track)
- **Step 2**: Student status (only for Tenant)
  - Checkbox: "I'm a student"
  - Info about benefits

**Props**:
```typescript
interface RoleAndStudentSelectorProps {
  onSelect: (data: RoleAndStudentData) => void;  // Called with role & isStudent
  onBack?: () => void;                            // Back button handler
  isLoading?: boolean;                            // Show loading state
  isOAuthFlow?: boolean;                          // Show OAuth-specific messaging
}
```

**Usage**:
```tsx
<RoleAndStudentSelector
  onSelect={(data) => handleRoleSelect(data)}
  onBack={() => handleBack()}
  isOAuthFlow={true}
/>
```

### 2. **InstitutionSelector**
`src/app/components/InstitutionSelector.tsx`

Displays:
- County selector dropdown (10+ Kenyan counties)
- Search box for institution name/abbreviation
- Scrollable list of institutions with type badges
- Each institution shows:
  - Full name (e.g., "University of Nairobi")
  - Abbreviation (e.g., "UoN")
  - Type badge (🎓 University, 📚 College, ⚙️ Polytechnic)

**Data**: Pre-populated with 40+ Kenyan universities, colleges, polytechnics

**Supported Counties**:
- Nairobi (12 institutions)
- Mombasa (4)
- Kilifi (2)
- Kisumu (3)
- Nakuru (3)
- Eldoret (2)
- Garissa (1)
- Wajir (1)

### 3. **OAuthProfileSetupPage**
`src/app/components/OAuthProfileSetupPage.tsx`

Orchestrates the OAuth profile setup flow:
1. Shows RoleAndStudentSelector
2. If student: Shows InstitutionSelector
3. Calls `authService.updateProfile()` to save role/institution
4. Routes to appropriate dashboard

**Props**:
```typescript
interface OAuthProfileSetupProps {
  onNavigate: (page: Page, data?: any) => void;
  currentUser: any;
}
```

---

## Updated Services

### authService Updates

**New in SignupData interface**:
```typescript
export interface SignupData {
  // ... existing fields
  institution?: string;        // Institution name (e.g., "University of Nairobi")
  institutionId?: string;      // Institution ID (e.g., "uon")
  institutionCounty?: string;  // County of institution
}
```

**New method**: (already existed, now used for OAuth profile setup)
```typescript
updateProfile(updates: Partial<User>): Promise<AuthResponse>
```

**Usage**:
```typescript
const response = await authService.updateProfile({
  role: 'tenant',
  isStudent: true,
  institution: 'University of Nairobi',
  institutionId: 'uon',
  institutionCounty: 'Nairobi'
});
```

---

## Updated Data Models

### User Interface
```typescript
export interface User {
  // ... existing fields
  isStudent?: boolean;          // NEW
  institution?: string;         // NEW - School/University name
  institutionId?: string;       // NEW - Institution ID code
  institutionCounty?: string;   // NEW - County where institution is located
}
```

---

## Updated Pages

### App.tsx
- Added `'oauth-profile-setup'` to Page type
- Import OAuthProfileSetupPage component
- Added case for oauth-profile-setup in renderPage()
- Updated auth state listener to detect OAuth users without role
- Routes OAuth users to oauth-profile-setup instead of login

### SignupPage
- Updated formData initialization to include institution fields
- Fixed useEffect to route to 'oauth-profile-setup' instead of 'login'

### TenantDashboard
- Updated institution filtering in useEffect
- Student users see listings from their institution's county first
- Welcome banner now displays institution name and logo (🎓)
- Institution badge shows in header

---

## Testing the Implementation

### Test Case 1: Regular Email Signup
1. On SignupPage, fill form with email/password
2. Select role (Tenant/Landlord)  
3. If Tenant: Check "I'm a student" checkbox
4. Complete signup
5. Verify: Lands on tenant dashboard

### Test Case 2: Google OAuth Signup (Tenant)
1. On SignupPage, click "Continue with Google"
2. OAuthAccountSelector opens
3. Select account or use different account
4. Authenticate with Google
5. **NEW**: RoleAndStudentSelector appears
6. Select "Tenant"
7. Check "Yes, I'm a student 🎓"
8. **NEW**: InstitutionSelector appears
9. Select county (e.g., "Mombasa")
10. Search and select institution (e.g., "Pwani University")
11. Verify: Lands on Tenant Dashboard with institution badge

### Test Case 3: Google OAuth Signup (Landlord)
1. Follow steps 1-4 of Test Case 2
2. Select "Landlord"
3. Verify: Lands on Landlord Dashboard (no institution selector)

### Test Case 4: Institution-Based Filtering
1. Login as student user with institution set
2. Check Recommended Properties section
3. Verify: Listings are from institution's county, not user's county

---

## Database Schema Updates

> **Note**: If using Supabase, these fields are stored in `auth.users.user_metadata`

New fields in auth.users metadata:
```sql
-- user_metadata should include:
{
  "name": "John Mwangi",
  "phone": "+254712345678",
  "role": "tenant",
  "county": "Mombasa",
  "isStudent": true,
  "institution": "Pwani University",
  "institutionId": "pwani",
  "institutionCounty": "Mombasa",
  "verified": true
}
```

If using custom users table, add columns:
```sql
ALTER TABLE users ADD COLUMN institution VARCHAR(255);
ALTER TABLE users ADD COLUMN institution_id VARCHAR(50);
ALTER TABLE users ADD COLUMN institution_county VARCHAR(100);
```

---

## Troubleshooting

### Problem: OAuth still shows "Failed to fetch"
**Solution**:
1. Clear browser localStorage: `localStorage.clear()`
2. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. Check Supabase logs: Dashboard → Logs
4. Verify Client ID/Secret are correct

### Problem: After OAuth, shows blank page
**Solution**:
1. Check browser console for errors: `F12 → Console`
2. Verify auth state listener is working
3. Check if user has role in Supabase: Auth → Users

### Problem: Institution selector not showing after student selection
**Solution**:
1. Verify `isStudent` state is true
2. Check React component hierarchy
3. Look for errors in console

### Problem: Listings not filtering by institution
**Solution**:
1. Verify user has `institutionCounty` set
2. Check if API supports institution parameter
3. Backend may need to implement institution filtering

---

## Migration Guide

If you have existing users without roles/institutions:

### Step 1: Manual Assignment (Admin Dashboard)
1. Add role selection interface to admin dashboard
2. Allow admins to assign roles to users

### Step 2: Email Campaign
Send email to users asking them to complete profile:
```
"Complete Your HouseCom Profile"
We added new features! 
Click here to select your role: [Link to oauth-profile-setup]
```

### Step 3: Login-Time Prompt
When user logs in without role:
- Show RoleAndStudentSelector
- Require completion before accessing dashboard

---

## Next Steps

1. ✅ Get Google OAuth credentials (see Step 1-2 above)
2. ✅ Update Supabase with credentials
3. ✅ Test OAuth flow
4. ✅ Deploy to production
5. ⏳ Monitor error logs
6. ⏳ Gather user feedback

---

## Support

For issues or questions:
1. Check error logs: Supabase Dashboard → Logs
2. Review browser console: F12 → Console  
3. Check Network tab: F12 → Network (OAuth requests)
4. Contact: [Your Support Email]

---

**Last Updated**: March 16, 2026
**Version**: 1.0.0
