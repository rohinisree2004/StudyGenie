/**
 * StudyGenie Phase 14 – Role-Based Dashboards & Analytics Verification Suite
 * Tests student, teacher, and admin consolidated dashboard payloads, strict RBAC isolation,
 * real-time metric calculations, and date-range filters.
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Phase 14 – Role-Based Dashboards & Analytics Verification Tests...\n');

  try {
    // 1️⃣ Authenticate Student, Teacher, and Admin
    console.log('1️⃣ Authenticating Student, Teacher, and Admin...');

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
    console.log(`   ✅ Student logged in: ${studentData.user.name} (${studentData.user.role})`);

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
    console.log(`   ✅ Educator logged in: ${teacherData.user.name} (${teacherData.user.role})`);

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
    console.log(`   ✅ Admin logged in: ${adminData.user.name} (${adminData.user.role})\n`);

    // 2️⃣ Verify RBAC Authorization Constraints on Dashboards
    console.log('2️⃣ Verifying Role-Based Access Control on Dashboard Endpoints...');

    // Student attempts to access Teacher & Admin dashboards
    const studentToTeacherRes = await fetch(`${BASE_URL}/dashboard/teacher`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (studentToTeacherRes.status !== 403) {
      throw new Error(`Expected Student to receive 403 on Teacher dashboard, got ${studentToTeacherRes.status}`);
    }
    console.log('   ✅ Student blocked from /api/dashboard/teacher (403 Forbidden)');

    const studentToAdminRes = await fetch(`${BASE_URL}/dashboard/admin`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (studentToAdminRes.status !== 403) {
      throw new Error(`Expected Student to receive 403 on Admin dashboard, got ${studentToAdminRes.status}`);
    }
    console.log('   ✅ Student blocked from /api/dashboard/admin (403 Forbidden)');

    // Teacher attempts to access Admin dashboard
    const teacherToAdminRes = await fetch(`${BASE_URL}/dashboard/admin`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    if (teacherToAdminRes.status !== 403) {
      throw new Error(`Expected Teacher to receive 403 on Admin dashboard, got ${teacherToAdminRes.status}`);
    }
    console.log('   ✅ Teacher blocked from /api/dashboard/admin (403 Forbidden)\n');

    // 3️⃣ Verify Student Dashboard Payload
    console.log('3️⃣ Testing Student Dashboard Payload (GET /api/dashboard/student)...');
    const studentDashboardRes = await fetch(`${BASE_URL}/dashboard/student`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentDashboardData = await studentDashboardRes.json();
    if (!studentDashboardData.success) {
      throw new Error('Failed to get student dashboard: ' + studentDashboardData.message);
    }
    const sd = studentDashboardData.data;

    if (!sd.studyStats || sd.studyStats.currentStreak === undefined) {
      throw new Error('Student dashboard missing studyStats/streak data');
    }
    if (!Array.isArray(sd.subjectProgress)) {
      throw new Error('Student dashboard missing subjectProgress array');
    }
    if (!sd.quizPerformance) {
      throw new Error('Student dashboard missing quizPerformance');
    }

    console.log(`   ✅ Student Dashboard Verified:`);
    console.log(`      • Active Streak: ${sd.studyStats.currentStreak} day(s) (Longest: ${sd.studyStats.longestStreak})`);
    console.log(`      • Total Study Hours: ${sd.studyStats.totalStudyHours} hrs across ${sd.studyStats.completedSessionsCount} session(s)`);
    console.log(`      • Enrolled Subjects with Progress: ${sd.subjectProgress.length} course(s)`);
    console.log(`      • Pending Tasks: ${sd.pendingTasks.length} | Pending Assignments: ${sd.pendingAssignments.length}`);
    console.log(`      • Quiz Attempts: ${sd.quizPerformance.totalAttempts} (Avg: ${sd.quizPerformance.averageScore}%, Pass Rate: ${sd.quizPerformance.passingRate}%)`);
    console.log(`      • Unread Notifications: ${sd.unreadNotificationsCount}\n`);

    // 4️⃣ Verify Teacher Dashboard Payload
    console.log('4️⃣ Testing Teacher Dashboard Payload (GET /api/dashboard/teacher)...');
    const teacherDashboardRes = await fetch(`${BASE_URL}/dashboard/teacher`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const teacherDashboardData = await teacherDashboardRes.json();
    if (!teacherDashboardData.success) {
      throw new Error('Failed to get teacher dashboard: ' + teacherDashboardData.message);
    }
    const td = teacherDashboardData.data;

    if (!td.kpis || td.kpis.totalAssignedSubjects === undefined) {
      throw new Error('Teacher dashboard missing kpis data');
    }
    if (!Array.isArray(td.assignedSubjects)) {
      throw new Error('Teacher dashboard missing assignedSubjects array');
    }

    console.log(`   ✅ Teacher Dashboard Verified:`);
    console.log(`      • Assigned Subjects: ${td.kpis.totalAssignedSubjects} | Total Students Taught: ${td.kpis.totalUniqueStudents}`);
    console.log(`      • Students On Track: ${td.kpis.studentsOnTrack} | Needing Support: ${td.kpis.studentsNeedingSupport}`);
    console.log(`      • Total Student Study Hours: ${td.kpis.totalStudentStudyHours} hrs`);
    console.log(`      • Assignment Submissions: ${td.assignmentOverview.totalActualSubmissions} / ${td.assignmentOverview.totalExpectedSubmissions} (Completion Rate: ${td.assignmentOverview.overallCompletionRate}%)`);
    console.log(`      • Pending Reviews: ${td.assignmentOverview.totalPendingReview}`);
    console.log(`      • Weak Areas Tracked: ${td.weakAreas.length}\n`);

    // 5️⃣ Verify Admin Dashboard Payload & Range Filters
    console.log('5️⃣ Testing Admin Dashboard Payload & Range Filters (GET /api/dashboard/admin)...');

    // Test 30d range
    const adminDashboardRes = await fetch(`${BASE_URL}/dashboard/admin?range=30d`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminDashboardData = await adminDashboardRes.json();
    if (!adminDashboardData.success) {
      throw new Error('Failed to get admin dashboard: ' + adminDashboardData.message);
    }
    const ad = adminDashboardData.data;

    if (!ad.kpis || !ad.studyActivityTrend || !ad.quizPerformanceAnalytics || !ad.aiUsageStats) {
      throw new Error('Admin dashboard missing required analytics fields');
    }

    console.log(`   ✅ Admin Dashboard (30 Days) Verified:`);
    console.log(`      • Total Users: ${ad.kpis.users.total} (Students: ${ad.kpis.users.students}, Teachers: ${ad.kpis.users.teachers}, Admins: ${ad.kpis.users.admins})`);
    console.log(`      • Active Subjects: ${ad.kpis.curriculum.activeSubjects} | Materials: ${ad.kpis.resources.totalMaterials} (${ad.kpis.resources.totalStorageMB} MB)`);
    console.log(`      • Study Activity Trend Data Points: ${ad.studyActivityTrend.length}`);
    console.log(`      • System Quiz Passing Rate: ${ad.quizPerformanceAnalytics.passingRate}% (Total: ${ad.quizPerformanceAnalytics.totalAttempts} attempts)`);
    console.log(`      • Score Brackets: Excellent(90+): ${ad.quizPerformanceAnalytics.brackets.excellent}, Good(75-89): ${ad.quizPerformanceAnalytics.brackets.good}, Avg(50-74): ${ad.quizPerformanceAnalytics.brackets.average}`);
    console.log(`      • AI Usage: Recs: ${ad.aiUsageStats.recommendationsGenerated}, Plans: ${ad.aiUsageStats.studyPlansCreated}, Chats: ${ad.aiUsageStats.conversationsStarted}, Summaries: ${ad.aiUsageStats.summariesCreated}`);
    console.log(`      • Cluster Health: ${ad.systemHealth.dbState} (${ad.systemHealth.dbHost}) - Uptime: ${ad.systemHealth.uptimeSeconds}s`);

    // Test 7d range
    const admin7dRes = await fetch(`${BASE_URL}/dashboard/admin?range=7d`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const admin7dData = await admin7dRes.json();
    if (!admin7dData.success || admin7dData.data.range !== '7d') {
      throw new Error('Failed 7d range query on admin dashboard');
    }
    console.log(`   ✅ Admin 7-day range filter successfully validated`);

    console.log('\n🎉 ALL PHASE 14 DASHBOARD & ANALYTICS BACKEND TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ Phase 14 Verification Test Failed:', error.message);
    process.exit(1);
  }
}

runTests();
