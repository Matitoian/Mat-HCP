#!/usr/bin/env node
/**
 * Test Script: Verify Landlord and Admin Account Logins
 */

const SUPABASE_URL = "https://zwbrhjofdggfjwsalrqt.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3YnJoam9mZGdnZmp3c2FscnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTU5MTMsImV4cCI6MjA4ODg3MTkxM30.U9gCDhZkYbM0l2ur8f8Uol4Wj_etfD6lmfgIGwLH7VE";

async function testLogin(email, password, accountType) {
  try {
    console.log(`\n🔐 Testing ${accountType} Login: ${email}`);
    
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.user) {
      console.log(`   ✅ LOGIN SUCCESS`);
      console.log(`   └─ User ID: ${data.user.id}`);
      console.log(`   └─ Email: ${data.user.email}`);
      console.log(`   └─ Role: ${data.user.user_metadata?.role || 'N/A'}`);
      console.log(`   └─ Access Token: ${data.access_token.substring(0, 30)}...`);
      return true;
    } else if (data.error) {
      console.log(`   ❌ LOGIN FAILED`);
      console.log(`   └─ Error: ${data.error} - ${data.error_description || ''}`);
      return false;
    } else {
      console.log(`   ❌ UNEXPECTED RESPONSE`);
      console.log(`   └─ Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ REQUEST FAILED`);
    console.log(`   └─ Error: ${error.message}`);
    return false;
  }
}

async function testHealthEndpoint() {
  try {
    console.log(`\n🏥 Testing Edge Function Health Endpoint`);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/server/health`, {
      headers: { 'apikey': ANON_KEY }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ HEALTH OK`);
      console.log(`   └─ Service: ${data.service}`);
      return true;
    } else {
      console.log(`   ❌ HEALTH CHECK FAILED - Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ REQUEST FAILED - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     HouseCom Login Test Suite (v1)                ║');
  console.log('╚════════════════════════════════════════════════════╝');

  const healthOk = await testHealthEndpoint();
  const landlordOk = await testLogin('juma@example.com', 'password123', 'Landlord');
  const adminOk = await testLogin('admin@housecom.co.ke', 'password123', 'Admin');

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║                    SUMMARY                         ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`Edge Function Health:  ${healthOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Landlord Account:      ${landlordOk ? '✅ CAN LOGIN' : '❌ CANNOT LOGIN'}`);
  console.log(`Admin Account:         ${adminOk ? '✅ CAN LOGIN' : '❌ CANNOT LOGIN'}`);
  
  if (healthOk && landlordOk && adminOk) {
    console.log('\n✅ All tests passed! Application is ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. See above for details.');
    if (!healthOk) console.log('   → Edge Function may not be deployed to Supabase');
    if (!landlordOk || !adminOk) console.log('   → Demo accounts may not exist in Supabase Auth');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
