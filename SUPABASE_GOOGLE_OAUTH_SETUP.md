# Enable Google OAuth in Supabase - Step by Step

## Your Credentials
- **Client ID**: `401641304600-v1rnpn8qe79pilvr6e7jqkr07svgfilm.apps.googleusercontent.com`
- **Client Secret**: `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`
- **Project ID**: `zwbrhjofdggfjwsalrqt`

## Steps to Enable in Supabase

### 1. Go to Supabase Dashboard
- URL: https://app.supabase.com
- Log in with your account

### 2. Select Your Project
- Click on project: **HouseCom** (or **zwbrhjofdggfjwsalrqt**)

### 3. Navigate to Authentication
Left sidebar menu:
```
Authentication
  └─ Providers
```

### 4. Find and Enable Google
- Look for **Google** in the providers list
- Click on **Google** provider card
- You should see:
  - [ ] Enabled toggle (currently OFF)
  - Client ID field (empty)
  - Client Secret field (empty)

### 5. Toggle Enabled
- Click the **Enabled** toggle to turn it ON (should show green)

### 6. Enter Your Credentials
**Client ID field:**
```
401641304600-v1rnpn8qe79pilvr6e7jqkr07svgfilm.apps.googleusercontent.com
```

**Client Secret field:**
```
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
```

### 7. Save
- Click **Save** button (bottom right)
- Wait for confirmation (should say "Provider saved" or similar)

### 8. Verify
You should see:
- ✅ Google provider showing as **Enabled** (green status)
- Credentials filled in (hidden but confirmed)

---

## If You Can't Find Google Provider

### Check if it's in a different section:
1. Go to **Authentication** → **Providers**
2. Look for **External OAuth Providers** section
3. Or scroll down to find **Google**

### If Google isn't listed:
- Click **Add Provider** or **+ New Provider**
- Select **Google** from list
- Then follow steps 5-7 above

---

## Redirect URIs Already Configured
Your Google credentials include the correct redirect URI:
```
https://zwbrhjofdggfjwsalrqt.supabase.co/auth/v1/callback
```
This was already set up in Google Cloud Console, so no changes needed there.

---

## Test After Enabling

1. **Restart dev server**:
   ```bash
   npm run dev
   ```

2. **Open signup page**:
   - Go to http://localhost:5173
   - Click "Create Account" or "Sign Up"

3. **Click "Continue with Google"**
   - Should open account selector modal (not error!)
   - Then Google login flow

4. **If still showing error**:
   - Clear cache: `Ctrl+Shift+Delete` browser settings
   - Hard refresh: `Ctrl+Shift+R`
   - Check browser console: F12 → Console tab
   - Look for exact error message

---

## Common Issues & Fixes

### Issue: "Failed to fetch" error still appears
**Solution**:
1. Verify toggle is actually ON (refresh page to confirm)
2. Make sure you clicked SAVE (not just filling fields)
3. Wait 30 seconds for Supabase to propagate changes
4. Clear browser cookies for localhost
5. Check if project ID matches: `zwbrhjofdggfjwsalrqt`

### Issue: Redirect URI mismatch error
**Solution**: This shouldn't happen - your Google credentials already have the correct URI. But if it does:
1. Go back to Google Cloud Console
2. Verify redirect URI is: `https://zwbrhjofdggfjwsalrqt.supabase.co/auth/v1/callback`

### Issue: Can't find the Provider settings
**Solution**:
1. Make sure you're logged into Supabase
2. Make sure correct project is selected (check project name)
3. Go to: Authentication (left menu) → Settings or Providers tab
4. Look for "External OAuth Providers" section

---

## Screenshots Help

If you get stuck:
1. Take a screenshot of Supabase Authentication page
2. Show if you see the Google provider
3. Show if Enabled toggle is visible
4. Paste any error messages

---

## Need Help?

If it's still not working after these steps:
1. Refresh Supabase Dashboard (F5)
2. Check project ID matches: `zwbrhjofdggfjwsalrqt`
3. Verify credentials have no extra spaces/characters
4. Try incognito mode (forces fresh browser state)
5. Check Supabase Status: https://status.supabase.com

---

**Status**: Ready to enable ✅
**Credentials**: Valid ✅
**Next Step**: Enable toggle in Supabase Dashboard
