const BASE_URL = 'http://localhost:5000/api/v1/auth';

async function runTests() {
  console.log('--- STARTING CARECIRCLE AUTH & AUTHZ VERIFICATION TESTS ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, extraInfo = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${extraInfo}`);
      failed++;
    }
  };

  try {
    const timestamp = Date.now();
    const elderlyEmail = `eleanor_${timestamp}@carecircle.test`;
    const caregiverEmail = `marcus_${timestamp}@carecircle.test`;

    // TEST 1: Register Elderly User
    console.log('\n[1] Testing Registration API (Elderly Role)...');
    const regRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Eleanor Vance',
        email: elderlyEmail,
        password: 'Password123!',
        phone: '+1 555-123-4567',
        role: 'elderly',
      }),
    });
    const regData = await regRes.json();
    const elderlyCookie = regRes.headers.get('set-cookie');
    assert(regRes.status === 201 && regData.success, 'Register Elderly User (201 Created)', JSON.stringify(regData));
    assert(regData.data.user.role === 'elderly', 'Elderly role assigned correctly');
    assert(regData.data.user.password === undefined, 'Password omitted from response JSON');
    assert(elderlyCookie && elderlyCookie.includes('carecircle_token'), 'HTTP-only auth cookie set on registration');
    const elderlyToken = regData.data.token;

    // TEST 2: Register Caregiver User
    console.log('\n[2] Testing Registration API (Caregiver Role)...');
    const cgRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Marcus Bell, RN',
        email: caregiverEmail,
        password: 'Password123!',
        phone: '+1 555-456-7890',
        role: 'caregiver',
      }),
    });
    const cgData = await cgRes.json();
    assert(cgRes.status === 201 && cgData.data.user.role === 'caregiver', 'Register Caregiver User (201 Created)');
    const caregiverToken = cgData.data.token;

    // TEST 3: Validation Error on short password
    console.log('\n[3] Testing Input Validation (Short Password)...');
    const invalidRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad Pass',
        email: `bad_${timestamp}@test.com`,
        password: 'short',
      }),
    });
    const invalidData = await invalidRes.json();
    assert(invalidRes.status === 400 && !invalidData.success, 'Short password rejected with 400 Bad Request');

    // TEST 4: Duplicate Email Conflict
    console.log('\n[4] Testing Duplicate Email Prevention...');
    const dupRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate',
        email: elderlyEmail,
        password: 'Password123!',
      }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409 && !dupData.success, 'Duplicate email rejected with 409 Conflict');

    // TEST 5: Login API with valid credentials
    console.log('\n[5] Testing Login API...');
    const loginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: elderlyEmail,
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success, 'Login successful with 200 OK');
    assert(loginData.data.token && loginData.data.user.email === elderlyEmail, 'Login returned valid token & user');

    // TEST 6: Login API with invalid credentials
    console.log('\n[6] Testing Login with Wrong Password...');
    const badLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: elderlyEmail,
        password: 'WrongPassword999!',
      }),
    });
    assert(badLoginRes.status === 401, 'Wrong password rejected with 401 Unauthorized');

    // TEST 7: Current User API (/me) using Bearer Token
    console.log('\n[7] Testing Current User API (/me) with Bearer Token...');
    const meRes = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${elderlyToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.data.email === elderlyEmail, 'Current user retrieved via Bearer header');

    // TEST 8: Current User API (/me) using Cookie
    console.log('\n[8] Testing Current User API (/me) with Cookie...');
    const cookieHeader = elderlyCookie.split(';')[0];
    const meCookieRes = await fetch(`${BASE_URL}/me`, {
      headers: { Cookie: cookieHeader },
    });
    const meCookieData = await meCookieRes.json();
    assert(meCookieRes.status === 200 && meCookieData.data.email === elderlyEmail, 'Current user retrieved via Cookie');

    // TEST 9: Unauthenticated Access Rejection
    console.log('\n[9] Testing Unauthenticated Route Protection...');
    const unauthRes = await fetch(`${BASE_URL}/me`);
    assert(unauthRes.status === 401, 'Unauthenticated request blocked with 401 Unauthorized');

    // TEST 10: Role-Based Authorization
    console.log('\n[10] Testing Role-Based Authorization Middleware...');
    // Elderly accessing elderly route -> allowed
    const elderAllowed = await fetch(`${BASE_URL}/test-elderly`, {
      headers: { Authorization: `Bearer ${elderlyToken}` },
    });
    assert(elderAllowed.status === 200, 'Elderly user permitted to access /test-elderly');

    // Elderly accessing caregiver route -> forbidden (403)
    const elderBlocked = await fetch(`${BASE_URL}/test-caregiver`, {
      headers: { Authorization: `Bearer ${elderlyToken}` },
    });
    assert(elderBlocked.status === 403, 'Elderly user forbidden (403) from accessing /test-caregiver');

    // Caregiver accessing caregiver route -> allowed
    const cgAllowed = await fetch(`${BASE_URL}/test-caregiver`, {
      headers: { Authorization: `Bearer ${caregiverToken}` },
    });
    assert(cgAllowed.status === 200, 'Caregiver user permitted to access /test-caregiver');

    // Caregiver accessing admin route -> forbidden (403)
    const cgBlocked = await fetch(`${BASE_URL}/test-admin`, {
      headers: { Authorization: `Bearer ${caregiverToken}` },
    });
    assert(cgBlocked.status === 403, 'Caregiver user forbidden (403) from accessing /test-admin');

    // TEST 11: Forgot Password API
    console.log('\n[11] Testing Forgot Password API...');
    const forgotRes = await fetch(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: elderlyEmail }),
    });
    const forgotData = await forgotRes.json();
    assert(forgotRes.status === 200 && forgotData.success, 'Forgot password returned 200 OK');
    const resetToken = forgotData.data.resetToken;
    assert(!!resetToken, 'Generated reset token retrieved');

    // TEST 12: Reset Password API
    console.log('\n[12] Testing Reset Password API...');
    const resetRes = await fetch(`${BASE_URL}/reset-password/${resetToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'NewSecurePassword456!' }),
    });
    const resetData = await resetRes.json();
    assert(resetRes.status === 200 && resetData.success, 'Password reset successful with 200 OK');

    // TEST 13: Login with New Password
    console.log('\n[13] Testing Login with New Password...');
    const newLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: elderlyEmail,
        password: 'NewSecurePassword456!',
      }),
    });
    assert(newLoginRes.status === 200, 'Login succeeded with newly updated password');

    // TEST 14: Logout API
    console.log('\n[14] Testing Logout API...');
    const logoutRes = await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${elderlyToken}` },
    });
    const logoutCookie = logoutRes.headers.get('set-cookie');
    assert(logoutRes.status === 200, 'Logout succeeded with 200 OK');
    assert(logoutCookie && logoutCookie.includes('carecircle_token=;'), 'Auth cookie expired on logout');

    console.log(`\n========================================`);
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
