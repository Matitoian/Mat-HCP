# OAuth Setup Guide - HouseCom

This guide explains how to obtain OAuth credentials for Google and Apple sign-in integration.

## Overview

HouseCom now supports social authentication via:
- **Google Sign-In** - OAuth 2.0 provider
- **Apple Sign-In** - OAuth 2.0 provider

Both feature account selection modal (like ChatGPT/Claude) allowing users to choose existing accounts before authenticating.

---

## 1. Google OAuth Setup

### Get Google Client ID

1. **Go to Google Cloud Console:**
   - Visit [https://console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create a new project:**
   - Click "Select a Project" → "New Project"
   - Enter: `HouseCom`
   - Click "Create"

3. **Enable Google+ API:**
   - In the sidebar, go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click it and press "Enable"

4. **Create OAuth Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Name: `HouseCom Web Client`
   - Add Authorized JavaScript origins:
     ```
     http://localhost:5173
     http://localhost:3000
     https://yourdomain.com
     ```
   - Add Authorized redirect URIs:
     ```
     http://localhost:5173/auth/callback/google
     http://localhost:3000/auth/callback/google
     https://yourdomain.com/auth/callback/google
     ```
   - Click "Create"

5. **Copy your credentials:**
   - You'll see a modal with:
     - **Client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)
     - **Client Secret** (keep this private!)
   - Download the JSON or copy these values

**Store these:**
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

## 2. Apple OAuth Setup

### Get Apple Sign-In Credentials

Apple requires more setup than Google:

#### Step 1: Apple Developer Account
- Enroll in [Apple Developer Program](https://developer.apple.com/) ($99/year)
- Required to obtain Sign in with Apple credentials

#### Step 2: Create App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to "Certificates, Identifiers & Profiles" → "Identifiers"
3. Click "+" to create new identifier
4. Select "App IDs"
5. Enter:
   - **Description:** `HouseCom App`
   - **Bundle ID:** `com.housecom.app` (reverse domain format)
6. Under "Capabilities", check "Sign in with Apple"
7. Click "Continue" → "Register"

#### Step 3: Create Service ID

1. Still in "Identifiers", click "+" again
2. Select "Services IDs"
3. Enter:
   - **Description:** `HouseCom Web Service`
   - **Identifier:** `com.housecom.service`
4. Check "Sign in with Apple"
5. Click "Configure" to set redirect URLs:
   - Add domains:
     ```
     localhost
     yourdomain.com
     ```
   - Add return URLs:
     ```
     http://localhost:5173/auth/callback/apple
     https://yourdomain.com/auth/callback/apple
     ```
6. Click "Save" → "Continue" → "Register"
7. **Copy the Service ID** (you'll see it in the identifier list)

#### Step 4: Create Private Key

1. In Developer Portal, go to "Keys"
2. Click "+" to create new key
3. Enter:
   - **Key Name:** `HouseCom SignIn Key`
4. Check "Sign in with Apple"
5. Click "Configure"
6. Select the App ID you created (HouseCom App)
7. Click "Save" → "Continue"
8. Click "Register"
9. **Download the private key file** (`.p8` file) - save this securely, you can only download once!

#### Step 5: Get Team ID

1. In Developer Portal, click your name (top right)
2. Go to "Membership details"
3. Find your **Team ID** (looks like: `A1B2C3D4E5`)

**Store these:**
```env
VITE_APPLE_TEAM_ID=your_team_id
VITE_APPLE_SERVICE_ID=com.housecom.service
VITE_APPLE_KEY_ID=key_id_from_downloaded_file
VITE_APPLE_PRIVATE_KEY=contents_of_downloaded_file
```

---

## 3. Environment Configuration

### Create `.env.local` file

Create a `.env.local` file in the project root (next to `package.json`):

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Apple Sign-In
VITE_APPLE_TEAM_ID=your_apple_team_id
VITE_APPLE_SERVICE_ID=com.housecom.service
VITE_APPLE_KEY_ID=extracted_from_key_file
VITE_APPLE_PRIVATE_KEY=|
  -----BEGIN PRIVATE KEY-----
  [paste your key file contents here]
  -----END PRIVATE KEY-----
```

### Reference File: `.env.example`

```env
# Google OAuth Credentials
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Apple Sign-In Credentials
VITE_APPLE_TEAM_ID=your_team_id
VITE_APPLE_SERVICE_ID=your_service_id
VITE_APPLE_KEY_ID=your_key_id
VITE_APPLE_PRIVATE_KEY=your_private_key

# Optional: Production Domain
VITE_PRODUCTION_DOMAIN=yourdomain.com
```

---

## 4. Testing OAuth Locally

### With Credentials Set Up:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Test Google Sign-In:**
   - Go to login/signup page
   - Click "Continue with Google"
   - Account selector modal appears
   - Select or add a Google account
   - Should redirect to choose role

4. **Test Apple Sign-In:**
   - Go to login/signup page
   - Click "Continue with Apple"
   - Account selector modal appears
   - Select or add an Apple account
   - Should redirect to choose role

### Test Accounts:

**Existing users (email/password):**
- Email: `grace@example.com` → Role: Tenant
- Email: `juma@example.com` → Role: Landlord  
- Email: `admin@housecom.co.ke` → Admin (bypasses role selection)

---

## 5. Production Deployment

### Update Redirect URIs

Before deploying, update OAuth credentials with production domain:

**Google:**
- Add `https://yourdomain.com` to JavaScript origins
- Add `https://yourdomain.com/auth/callback/google` to redirect URIs

**Apple:**
- Add `yourdomain.com` to return URL domains
- Add `https://yourdomain.com/auth/callback/apple` to return URLs

### Environment Variables

Set production environment variables in your hosting platform:

- **Vercel:** Settings → Environment Variables
- **Netlify:** Site settings → Build & deploy → Environment
- **Custom Server:** `.env` file (never commit to git!)

### Security Best Practices

1. **Never commit credentials to Git:**
   ```bash
   # Add to .gitignore
   .env.local
   .env*.local
   ```

2. **Use secret management:**
   - Store keys in hosting platform's secret manager
   - Rotate credentials periodically (annually recommended)

3. **Restrict OAuth app usage:**
   - Enable suspicious login protection in Google Console
   - Monitor Apple Sign-In usage in Developer Portal

---

## 6. Troubleshooting

### "Invalid Client ID" Error

- ✅ Check `VITE_GOOGLE_CLIENT_ID` in `.env.local`
- ✅ Verify authorized JavaScript origins include your domain
- ✅ Restart dev server after env changes

### "Redirect URI mismatch"

- ✅ Ensure redirect URI in OAuth settings matches exactly
- ✅ Include protocol (`http://` or `https://`)
- ✅ Check for trailing slashes

### Apple Sign-In Not Working

- ✅ Verify Service ID is in `.env.local`
- ✅ Check Private Key file is valid (starts with `-----BEGIN PRIVATE KEY-----`)
- ✅ Confirm Team ID is correct (found in Membership details)

### Account Selector Modal Doesn't Appear

- ✅ Check browser console for errors (F12)
- ✅ Verify OAuthAccountSelector component is imported
- ✅ Ensure `oauthAccountSelector` state is initialized

---

## 7. Next Steps

**After obtaining credentials:**

1. Create `.env.local` with values from this guide
2. Run `npm run dev` to start development
3. Test Google and Apple sign-in flows
4. Test role selection (Tenant/Landlord/Admin)
5. Deploy to production with credentials in hosting platform

**Questions or Issues?**

- Check `.env.local` is in project root
- Verify credentials are formatted exactly as provided
- Restart development server after env changes
- Clear browser localStorage if testing multiple OAuth flows

---

**File Structure After Setup:**
```
HouseCom/
├── .env.local              (← Create with credentials)
├── .env.example            (← Reference file)
├── src/
│   ├── lib/authService.ts  (← Updated for OAuth)
│   └── app/components/
│       ├── LoginPage.tsx           (← OAuth + account selector)
│       ├── SignupPage.tsx          (← OAuth + account selector)
│       └── OAuthAccountSelector.tsx (← New modal component)
└── package.json
```

---

**Ready to proceed?** Please provide your:
1. Google Client ID and Client Secret
2. Apple Team ID, Service ID, Key ID, and Private Key

Or let me know if you need help obtaining these from the developer consoles!
