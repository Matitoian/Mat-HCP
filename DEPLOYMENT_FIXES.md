# Critical Fixes Applied ✅

## What's Fixed

1. **API Endpoint Fixed** ✅  
   - Changed: `https://.../functions/v1/make-server-c6a3dee9`
   - To: `https://.../functions/v1/server`
   - File: [src/lib/apiService.ts](src/lib/apiService.ts#L8)

2. **Edge Function Routes Fixed** ✅  
   - Removed 32 instances of `/make-server-c6a3dee9` prefix from routes
   - Routes now match: `/health`, `/properties`, `/auth/signup`, etc.
   - File: [supabase/functions/server/index.tsx](supabase/functions/server/index.tsx)

## Next Steps (REQUIRED)

### Step 1: Deploy Fixed Edge Function

Choose one deployment method:

#### Option A: Deploy via Supabase Dashboard (Easiest)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/zwbrhjofdggfjwsalrqt/functions)
2. Click on `server` function → Code
3. Replace all code with the fixed [supabase/functions/server/index.tsx](supabase/functions/server/index.tsx)
4. Click "Deploy"

#### Option B: Deploy via Supabase CLI (when it works)
```bash
npx supabase@latest functions deploy server
```

#### Option C: Deploy via GitHub Actions
Push to your repository (if connected). Supabase auto-deploys from git.

### Step 2: Create Demo Accounts in Supabase Auth

Go to [Supabase Dashboard → Authentication → Users](https://supabase.com/dashboard/project/zwbrhjofdggfjwsalrqt/auth/users)

Click **"Add user"** three times to create:

**1. Grace (Tenant - Student)**
- Email: `grace@example.com`
- Password: `password123`
- User Metadata (JSON tab):
```json
{
  "name": "Grace Mwangi",
  "role": "tenant",
  "phone": "+254712345678",
  "county": "Mombasa",
  "isStudent": true,
  "institution": "Technical University of Mombasa",
  "institutionId": "tum",
  "institutionCounty": "Mombasa"
}
```

**2. Juma (Landlord)**
- Email: `juma@example.com`
- Password: `password123`
- User Metadata:
```json
{
  "name": "Juma Khalifa",
  "role": "landlord",
  "phone": "+254723456789",
  "county": "Mombasa"
}
```

**3. Admin**
- Email: `admin@housecom.co.ke`
- Password: `password123`
- User Metadata:
```json
{
  "name": "Admin User",
  "role": "admin",
  "phone": "+254700000000",
  "county": "Mombasa"
}
```

### Step 3: Test Login

1. Open http://localhost:5178/login (or next available port)
2. Try logging in with:
   - **Grace**: grace@example.com / password123 (Should see tenant dashboard with institution filter)
   - **Juma**: juma@example.com / password123 (Should see landlord dashboard)
   - **Admin**: admin@housecom.co.ke / password123 (Should see admin dashboard)

## If CORS Errors Persist

After creating accounts and deploying the function:
- Hard refresh browser: `Ctrl+Shift+R`
- Check browser console for new errors
- Verify function is deployed in Supabase dashboard

## Root Cause of Previous Errors

- ✅ **CORS errors on API calls** → `to: supabase-c6a3dee9` endpoint didn't exist. Now pointing to correct `/functions/v1/server`
- ✅ **Login failing with 400** → Demo accounts didn't exist. Create them in Supabase dashboard now.
