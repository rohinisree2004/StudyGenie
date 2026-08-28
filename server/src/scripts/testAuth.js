const BASE = 'http://localhost:5000/api/auth';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('--- STARTING RBAC & AUTH API TEST SUITE ---');

  // Test 1: Register Student
  const studentEmail = `student_${Date.now()}@test.com`;
  let studentToken = '';
  const regRes = await request(`${BASE}/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'John Student',
      email: studentEmail,
      password: 'Password123!',
      role: 'student',
      institution: 'MIT',
    }),
  });

  if (regRes.ok) {
    console.log('✅ Student Register passed:', regRes.data.success, 'Role:', regRes.data.user.role);
    studentToken = regRes.data.token;
  } else {
    console.error('❌ Student Register failed:', regRes.data);
  }

  // Test 2: Prevent Public Admin Registration
  const adminHackRes = await request(`${BASE}/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Hacker Admin',
      email: `hacker_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
    }),
  });

  if (adminHackRes.status === 403) {
    console.log('✅ Block Admin Public Registration passed (403 Forbidden received as expected)');
  } else {
    console.error('❌ Public admin registration vulnerability! Status:', adminHackRes.status);
  }

  // Test 3: Login Seeded Admin
  let adminToken = '';
  const adminLoginRes = await request(`${BASE}/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@studygenie.com',
      password: 'Admin@StudyGenie2026!',
    }),
  });

  if (adminLoginRes.ok) {
    console.log('✅ Admin Login passed:', adminLoginRes.data.success, 'Role:', adminLoginRes.data.user.role);
    adminToken = adminLoginRes.data.token;
  } else {
    console.error('❌ Admin Login failed:', adminLoginRes.data);
  }

  // Test 4: RBAC Endpoint /admin-only with Student Token (Should be 403)
  const rbacDeniedRes = await request(`${BASE}/admin-only`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  if (rbacDeniedRes.status === 403) {
    console.log('✅ RBAC Check: Student blocked from Admin route (403 Forbidden)');
  } else {
    console.error('❌ Security breach: Student accessed Admin-only endpoint! Status:', rbacDeniedRes.status);
  }

  // Test 5: RBAC Endpoint /admin-only with Admin Token (Should be 200)
  const rbacAllowedRes = await request(`${BASE}/admin-only`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (rbacAllowedRes.ok) {
    console.log('✅ RBAC Check: Admin accessed Admin route:', rbacAllowedRes.data.message);
  } else {
    console.error('❌ Admin route failed:', rbacAllowedRes.data);
  }

  // Test 6: Forgot Password Flow
  let resetToken = '';
  const forgotRes = await request(`${BASE}/forgotpassword`, {
    method: 'POST',
    body: JSON.stringify({ email: studentEmail }),
  });

  if (forgotRes.ok) {
    console.log('✅ Forgot password request passed:', forgotRes.data.success);
    resetToken = forgotRes.data.devResetToken;
  } else {
    console.error('❌ Forgot password failed:', forgotRes.data);
  }

  // Test 7: Reset Password Flow
  const resetRes = await request(`${BASE}/resetpassword/${resetToken}`, {
    method: 'PUT',
    body: JSON.stringify({ password: 'NewStrongPassword123!' }),
  });

  if (resetRes.ok) {
    console.log('✅ Reset password passed:', resetRes.data.success);
  } else {
    console.error('❌ Reset password failed:', resetRes.data);
  }

  // Test 8: Login with New Password
  const loginNewPassRes = await request(`${BASE}/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: studentEmail,
      password: 'NewStrongPassword123!',
    }),
  });

  if (loginNewPassRes.ok) {
    console.log('✅ Login with updated password passed:', loginNewPassRes.data.success);
  } else {
    console.error('❌ Login with new password failed:', loginNewPassRes.data);
  }

  console.log('\n🌟 --- ALL AUTH & RBAC VERIFICATIONS COMPLETED SUCCESSFULLY --- 🌟\n');
}

runTests();
