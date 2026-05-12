# Demo Account Setup Guide

The demo accounts are used to test the application locally. Since client-side seeding causes CORS errors, you have two options:

## Option 1: Manual Setup (Easiest)

1. Go to your Supabase Dashboard: `https://supabase.com/dashboard/project/zwbrhjofdggfjwsalrqt/auth/users`

2. Click **"Add user"** button to manually create each demo account:

### Demo Account 1: Tenant (Student)
- **Email**: `grace@example.com`
- **Password**: `password123`
- **User Metadata** (Set in JSON editor):
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

### Demo Account 2: Landlord
- **Email**: `juma@example.com`
- **Password**: `password123`
- **User Metadata**:
```json
{
  "name": "Juma Khalifa",
  "role": "landlord",
  "phone": "+254723456789",
  "county": "Mombasa",
  "isStudent": false
}
```

### Demo Account 3: Admin
- **Email**: `admin@housecom.co.ke`
- **Password**: `password123`
- **User Metadata**:
```json
{
  "name": "Admin User",
  "role": "admin",
  "phone": "+254700000000",
  "county": "Mombasa",
  "isStudent": false
}
```

## Option 2: Programmatic Setup (From Terminal)

Run this command from your project root to seed demo users via backend:

```bash
curl -X POST https://zwbrhjofdggfjwsalrqt.supabase.co/functions/v1/make-server-c6a3dee9/seed \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json"
```

Get your `SUPABASE_ANON_KEY` from:
1. Supabase Dashboard → Settings → API
2. Copy the "anon public" key
3. Replace `<SUPABASE_ANON_KEY>` in the command above

## Testing Login

Once accounts are created, test with:

1. **Tenant Student**: 
   - Email: `grace@example.com`
   - Password: `password123`
   - **Expected**: Tenant dashboard → See institutions filter on listings

2. **Landlord**:
   - Email: `juma@example.com`
   - Password: `password123`
   - **Expected**: Landlord dashboard → Can add properties

3. **Admin**:
   - Email: `admin@housecom.co.ke`
   - Password: `password123`
   - **Expected**: Admin dashboard with analytics

## Next Steps

- After creating one demo account, test the login flow (http://localhost:5174/login)
- Test Google OAuth by clicking "Sign in with Google"
- Complete the role/institution selection flow after OAuth
- Check that tenant students see institution-filtered listings

## Troubleshooting

**"Invalid login credentials"** → Verify the email and password are correct in Supabase Auth

**"Failed to fetch" errors** (CORS) → Do NOT refresh the page multiple times. Seed endpoint only needed on initial setup.

**"Page not found" after OAuth** → OAuth profile setup page might not have rendered. Click browser back/forward or refresh.
