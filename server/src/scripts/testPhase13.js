/**
 * StudyGenie Phase 13 – Admin & System Management Automated Verification Suite
 * Tests admin authentication, RBAC authorization blocks (403 for students & teachers),
 * dashboard statistics, full user lifecycle (CRUD, status toggling, self-protection guards),
 * student/teacher directories, subject teacher assignment, material/quiz moderation,
 * system health diagnostics, and platform-wide broadcast notifications.
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Phase 13 – Admin & System Management Verification Tests...\n');

  try {
    // 1️⃣ Authenticate Admin, Teacher, and Student
    console.log('1️⃣ Authenticating Admin, Teacher, and Student...');

    // Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@studygenie.com',
        password: 'Admin@StudyGenie2026!',
      }),
    });
    const adminData = await adminLoginRes.json();
    if (!adminData.success) throw new Error('Admin login failed: ' + adminData.message);
    const adminToken = adminData.token;
    const adminId = adminData.user.id || adminData.user._id;
    console.log(`   ✅ Admin logged in: ${adminData.user.name} (${adminData.user.email}) - Role: ${adminData.user.role}`);

    // Teacher Login
    const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.teacher@studygenie.com',
        password: 'TeacherPass123!',
      }),
    });
    const teacherData = await teacherLoginRes.json();
    if (!teacherData.success) throw new Error('Teacher login failed: ' + teacherData.message);
    const teacherToken = teacherData.token;
    const teacherId = teacherData.user.id || teacherData.user._id;
    console.log(`   ✅ Educator logged in: ${teacherData.user.name} (${teacherData.user.email})`);

    // Student Login
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.student@studygenie.com',
        password: 'StudentPass123!',
      }),
    });
    const studentData = await studentLoginRes.json();
    if (!studentData.success) throw new Error('Student login failed: ' + studentData.message);
    const studentToken = studentData.token;
    const studentId = studentData.user.id || studentData.user._id;
    console.log(`   ✅ Student logged in: ${studentData.user.name} (${studentData.user.email})\n`);

    // 2️⃣ RBAC Isolation: Verify non-admin roles are strictly blocked from /api/admin
    console.log('2️⃣ Verifying strict RBAC authorization blocks (403 Forbidden for non-admins)...');

    const studentAdminRes = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (studentAdminRes.status !== 403) {
      throw new Error(`Expected student to be blocked with 403, got status ${studentAdminRes.status}`);
    }
    console.log('   ✅ Student request to /api/admin blocked with 403 Forbidden');

    const teacherAdminRes = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    if (teacherAdminRes.status !== 403) {
      throw new Error(`Expected teacher to be blocked with 403, got status ${teacherAdminRes.status}`);
    }
    console.log('   ✅ Teacher request to /api/admin blocked with 403 Forbidden\n');

    // 3️⃣ Test Admin Dashboard Statistics
    console.log('3️⃣ Testing Admin Dashboard KPIs (GET /api/admin/dashboard-stats)...');
    const statsRes = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await statsRes.json();
    if (!statsData.success) throw new Error('Failed to get admin dashboard stats: ' + statsData.message);

    console.log(`   ✅ Platform Stats Retrieved:`);
    console.log(`      • Total Users: ${statsData.data.users.total} (Students: ${statsData.data.users.students}, Teachers: ${statsData.data.users.teachers}, Admins: ${statsData.data.users.admins})`);
    console.log(`      • Active Subjects: ${statsData.data.curriculum.activeSubjects} | Published Topics: ${statsData.data.curriculum.totalTopics}`);
    console.log(`      • Materials: ${statsData.data.resources.totalMaterials} | Total Quizzes: ${statsData.data.resources.totalQuizzes}`);
    console.log(`      • Database Cluster: ${statsData.data.systemHealth.dbState} (${statsData.data.systemHealth.dbHost})\n`);

    // 4️⃣ Test User Management Lifecycle (Create, Query, Update, Suspend, Self-Protection, Delete)
    console.log('4️⃣ Testing User Management Lifecycle & Administrative Safeguards...');

    const tempUserEmail = `phase13.test.${Date.now()}@studygenie.com`;
    const tempPassword = 'TemporaryPassword123!';

    // Create User
    const createUserRes = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Phase 13 Test Student',
        email: tempUserEmail,
        password: tempPassword,
        role: 'student',
        institution: 'Antigravity Test Academy',
        gradeLevel: 'Undergraduate',
        bio: 'Automated test account for user management verification.',
      }),
    });
    const createUserData = await createUserRes.json();
    if (!createUserData.success) throw new Error('Admin failed to create user: ' + createUserData.message);
    const tempUserId = createUserData.user._id || createUserData.user.id;
    console.log(`   ✅ Admin successfully created new user: ${createUserData.user.name} (${tempUserId})`);

    // Search & Filter Users
    const queryUsersRes = await fetch(`${BASE_URL}/admin/users?search=${encodeURIComponent(tempUserEmail)}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const queryUsersData = await queryUsersRes.json();
    if (!queryUsersData.success || queryUsersData.count !== 1) {
      throw new Error('User search did not locate newly created user');
    }
    console.log(`   ✅ Search query successfully found user by email`);

    // Update User Profile
    const updateUserRes = await fetch(`${BASE_URL}/admin/users/${tempUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Phase 13 Test Student Updated',
        institution: 'Imperial College of Testing',
      }),
    });
    const updateUserData = await updateUserRes.json();
    if (!updateUserData.success || updateUserData.user.name !== 'Phase 13 Test Student Updated') {
      throw new Error('Failed to update user profile via admin API');
    }
    console.log(`   ✅ User profile updated: ${updateUserData.user.name} at ${updateUserData.user.institution}`);

    // Toggle Account Status: Suspend User
    const suspendRes = await fetch(`${BASE_URL}/admin/users/${tempUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ accountStatus: 'suspended' }),
    });
    const suspendData = await suspendRes.json();
    if (!suspendData.success || suspendData.user.accountStatus !== 'suspended') {
      throw new Error('Failed to suspend user: ' + suspendData.message);
    }
    console.log(`   ✅ User accountStatus set to suspended`);

    // Verify Suspended User Cannot Authenticate
    const suspendedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: tempUserEmail,
        password: tempPassword,
      }),
    });
    const suspendedLoginData = await suspendedLoginRes.json();
    if (suspendedLoginRes.status !== 403 && suspendedLoginData.success) {
      throw new Error('Suspended user was unexpectedly allowed to log in');
    }
    console.log(`   ✅ Suspended user login properly rejected (${suspendedLoginData.message})`);

    // Re-activate User
    const reactivateRes = await fetch(`${BASE_URL}/admin/users/${tempUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ accountStatus: 'active' }),
    });
    const reactivateData = await reactivateRes.json();
    if (!reactivateData.success || reactivateData.user.accountStatus !== 'active') {
      throw new Error('Failed to re-activate user');
    }
    console.log(`   ✅ User accountStatus restored to active`);

    // Test Admin Self-Protection Safeguards
    const selfSuspendRes = await fetch(`${BASE_URL}/admin/users/${adminId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ accountStatus: 'suspended' }),
    });
    if (selfSuspendRes.status !== 400) {
      throw new Error('Admin was able to suspend own account! Self-protection failed.');
    }
    console.log(`   ✅ Self-Protection: Admin cannot suspend own account (Blocked with 400)`);

    const selfDeleteRes = await fetch(`${BASE_URL}/admin/users/${adminId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (selfDeleteRes.status !== 400) {
      throw new Error('Admin was able to delete own account! Self-protection failed.');
    }
    console.log(`   ✅ Self-Protection: Admin cannot delete own account (Blocked with 400)`);

    // Delete Temporary Test User
    const deleteUserRes = await fetch(`${BASE_URL}/admin/users/${tempUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteUserData = await deleteUserRes.json();
    if (!deleteUserData.success) throw new Error('Failed to delete temporary user: ' + deleteUserData.message);
    console.log(`   ✅ User safely deleted without orphaned breaks: ${deleteUserData.message}\n`);

    // 5️⃣ Test Student and Teacher Directories & Teacher Assignment
    console.log('5️⃣ Testing Student & Teacher Directories and Course Assignment...');
    const studentsListRes = await fetch(`${BASE_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const studentsListData = await studentsListRes.json();
    if (!studentsListData.success) throw new Error('Failed to get admin students: ' + studentsListData.message);
    console.log(`   ✅ Students Directory: ${studentsListData.count} student(s) retrieved with enrollment stats`);

    const teachersListRes = await fetch(`${BASE_URL}/admin/teachers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const teachersListData = await teachersListRes.json();
    if (!teachersListData.success) throw new Error('Failed to get admin teachers: ' + teachersListData.message);
    console.log(`   ✅ Teachers Directory: ${teachersListData.count} faculty educator(s) retrieved`);

    // Check course assignment
    const subjectsRes = await fetch(`${BASE_URL}/subjects`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const subjectsData = await subjectsRes.json();
    if (subjectsData.success && subjectsData.subjects?.length > 0) {
      const targetSubj = subjectsData.subjects[0];
      const assignRes = await fetch(`${BASE_URL}/admin/subjects/${targetSubj.id}/assign-teacher`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ teacherId: teacherId }),
      });
      const assignData = await assignRes.json();
      if (!assignData.success) throw new Error('Failed to assign teacher to subject: ' + assignData.message);
      console.log(`   ✅ Faculty Assignment: Assigned teacher to course "${targetSubj.title}"`);
    }

    // 6️⃣ Test Material and Quiz Admin Moderation Endpoints
    console.log('\n6️⃣ Testing Study Material & Quiz Moderation Endpoints...');
    const materialsRes = await fetch(`${BASE_URL}/admin/materials`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const materialsData = await materialsRes.json();
    if (!materialsData.success) throw new Error('Failed to get admin materials: ' + materialsData.message);
    console.log(`   ✅ Admin Materials: ${materialsData.count} material(s) retrieved`);

    if (materialsData.materials?.length > 0) {
      const sampleMat = materialsData.materials[0];
      const toggleVisRes = await fetch(`${BASE_URL}/admin/materials/${sampleMat._id}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isPublic: !sampleMat.isPublic }),
      });
      const toggleVisData = await toggleVisRes.json();
      if (!toggleVisData.success) throw new Error('Failed to toggle material visibility: ' + toggleVisData.message);
      console.log(`   ✅ Material Visibility Toggled: ${sampleMat.title} -> isPublic: ${toggleVisData.material.isPublic}`);

      // Revert visibility back
      await fetch(`${BASE_URL}/admin/materials/${sampleMat._id}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isPublic: sampleMat.isPublic }),
      });
    }

    const quizzesRes = await fetch(`${BASE_URL}/admin/quizzes`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const quizzesData = await quizzesRes.json();
    if (!quizzesData.success) throw new Error('Failed to get admin quizzes: ' + quizzesData.message);
    console.log(`   ✅ Admin Quizzes: ${quizzesData.count} quiz assessment(s) retrieved`);

    // 7️⃣ Test System Health & Platform Broadcast Notifications
    console.log('\n7️⃣ Testing System Health & Platform Broadcast Dispatcher...');
    const healthRes = await fetch(`${BASE_URL}/admin/system-health`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const healthData = await healthRes.json();
    if (!healthData.success) throw new Error('Failed to get system health: ' + healthData.message);
    console.log(`   ✅ System Diagnostics:`);
    console.log(`      • Uptime: ${healthData.system.uptimeFormatted}`);
    console.log(`      • Database Status: ${healthData.system.database.status} (${healthData.system.database.host})`);
    console.log(`      • Memory Heap Used: ${healthData.system.memory.heapUsedMB} MB / ${healthData.system.memory.heapTotalMB} MB`);

    // Broadcast announcement to students
    const broadcastRes = await fetch(`${BASE_URL}/admin/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Platform Maintenance Notice: Scheduled Update',
        message: 'StudyGenie servers will undergo routine maintenance at midnight UTC. All study sessions will be preserved.',
        targetRole: 'student',
        priority: 'high',
        category: 'system',
      }),
    });
    const broadcastData = await broadcastRes.json();
    if (!broadcastData.success) throw new Error('Failed to send broadcast: ' + broadcastData.message);
    console.log(`   ✅ Platform Broadcast Dispatched: ${broadcastData.sentCount} student(s) notified`);

    // Verify Student received the broadcast notification in their feed
    const studentNotifsRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentNotifsData = await studentNotifsRes.json();
    const notifList = studentNotifsData.data || studentNotifsData.notifications || [];
    const foundBroadcast = notifList.find(
      (n) => n.title.includes('Scheduled Update') && n.type === 'system'
    );
    if (!foundBroadcast) {
      throw new Error('Broadcast notification was not received in student notification feed');
    }
    console.log(`   ✅ Student Notification Feed verified: Received broadcast "${foundBroadcast.title}" (Priority: ${foundBroadcast.priority})`);

    console.log('\n🎉 ALL PHASE 13 BACKEND VERIFICATION SUITES PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ Phase 13 Verification Test Failed:', error.message);
    process.exit(1);
  }
}

runTests();
