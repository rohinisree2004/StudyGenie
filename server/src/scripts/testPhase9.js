import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

const STUDENT_CREDENTIALS = {
  email: 'alex.student@studygenie.com',
  password: 'StudentPass123!',
};

const TEACHER_CREDENTIALS = {
  email: 'sarah.teacher@studygenie.com',
  password: 'TeacherPass123!',
};

const ADMIN_CREDENTIALS = {
  email: 'admin@studygenie.com',
  password: 'Admin@StudyGenie2026!',
};

async function postJson(url, body, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status} on ${url}`);
  }
  return json;
}

async function getJson(url, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status} on ${url}`);
  }
  return json;
}

async function deleteJson(url, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status} on ${url}`);
  }
  return json;
}

async function runPhase9Tests() {
  console.log('🧪 Starting Phase 9 – Progress Tracking & Performance Analytics Verification Tests...\n');

  try {
    // 1. Authenticate Student, Teacher, and Admin
    console.log('1️⃣ Authenticating Student, Educator, and Admin...');
    const [studentAuth, teacherAuth, adminAuth] = await Promise.all([
      postJson(`${API_BASE}/auth/login`, STUDENT_CREDENTIALS),
      postJson(`${API_BASE}/auth/login`, TEACHER_CREDENTIALS),
      postJson(`${API_BASE}/auth/login`, ADMIN_CREDENTIALS),
    ]);

    const studentToken = studentAuth.token;
    const teacherToken = teacherAuth.token;
    const adminToken = adminAuth.token;
    const studentId = studentAuth.user.id || studentAuth.user._id;

    console.log(`   ✅ Student: ${studentAuth.user.name} (${studentId})`);
    console.log(`   ✅ Educator: ${teacherAuth.user.name}`);
    console.log(`   ✅ Admin: ${adminAuth.user.name}\n`);

    // 2. Fetch enrolled subject for testing
    console.log('2️⃣ Fetching student enrolled subjects...');
    const subjectsRes = await getJson(`${API_BASE}/subjects`, studentToken);
    const subjects = subjectsRes.subjects || subjectsRes.data || [];
    if (!subjects || subjects.length === 0) {
      throw new Error('No enrolled subjects found for test student.');
    }
    const testSubject = subjects[0];
    const subjectId = testSubject.id || testSubject._id;
    console.log(`   ✅ Using Subject: "${testSubject.title}" (${testSubject.code || 'NO-CODE'}) - ID: ${subjectId}\n`);

    // 3. Seed real activity documents to ensure mathematical precision in calculations
    console.log('3️⃣ Creating test completed activity documents (StudySession, Task)...');

    // Create completed StudySession (90 minutes)
    const sessionRes = await postJson(
      `${API_BASE}/study-sessions`,
      {
        title: 'Phase 9 Test Eigenvectors Deep Dive',
        subject: subjectId,
        startTime: new Date(Date.now() - 90 * 60 * 1000),
        endTime: new Date(),
        duration: 90,
        status: 'completed',
        completedAt: new Date(),
      },
      studentToken
    );
    const testSessionId = (sessionRes.session || sessionRes.data)._id || (sessionRes.session || sessionRes.data).id;
    console.log(`   ✅ Created completed StudySession (90m, ID: ${testSessionId})`);

    // Create completed Task
    const taskRes = await postJson(
      `${API_BASE}/tasks`,
      {
        title: 'Phase 9 Test Matrix Orthogonality Problem Set',
        subject: subjectId,
        priority: 'high',
        status: 'completed',
        isCompleted: true,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      studentToken
    );
    const testTaskId = (taskRes.task || taskRes.data)._id || (taskRes.task || taskRes.data).id;
    console.log(`   ✅ Created completed Task (ID: ${testTaskId})\n`);

    // 4. Test Student Dashboard Progress Endpoint
    console.log('4️⃣ Testing Student Dashboard Progress (/api/progress/dashboard)...');
    const dashboardRes = await getJson(`${API_BASE}/progress/dashboard?period=daily`, studentToken);
    const dashboard = dashboardRes.data;

    console.log('   ✅ Student Dashboard Progress retrieved:');
    console.log(`      Current Streak: ${dashboard.overview.streak.currentStreak} day(s)`);
    console.log(`      Longest Streak: ${dashboard.overview.streak.longestStreak} day(s)`);
    console.log(`      Total Study Hours: ${dashboard.overview.studyHours.totalHours} hrs`);
    console.log(`      Completed Sessions: ${dashboard.overview.studyHours.completedSessions}/${dashboard.overview.studyHours.totalSessions}`);
    console.log(`      Task Completion Rate: ${dashboard.overview.tasks.completionRate}% (${dashboard.overview.tasks.completedTasks}/${dashboard.overview.tasks.totalTasks})`);
    console.log(`      Quiz Attempts Count: ${dashboard.overview.quizzes.totalAttempts}`);
    console.log(`      Quiz Average Score: ${dashboard.overview.quizzes.averageScore}%`);

    if (dashboard.overview.studyHours.totalHours <= 0) {
      throw new Error('Study hours should be > 0 after completing 90m session.');
    }
    if (dashboard.overview.streak.currentStreak < 1) {
      throw new Error('Current streak should be at least 1 after activity today.');
    }

    // 5. Verify structured recommendationDataContract for Phase 10
    console.log('\n5️⃣ Verifying Phase 10 AI Recommendation Contract Structure...');
    const contract = dashboard.recommendationDataContract;
    if (!contract || !contract.quizPerformance || !contract.studyHistory || !contract.academicWorkload) {
      throw new Error('Missing structured recommendationDataContract in dashboard payload.');
    }
    console.log(`   ✅ Contract present:`);
    console.log(`      Weak Topics Count: ${contract.weakTopics.length}`);
    console.log(`      Quiz Performance Avg: ${contract.quizPerformance.averageScore}%`);
    console.log(`      Study History Total Hours: ${contract.studyHistory.totalHours} hrs`);
    console.log(`      Academic Workload (Upcoming Tasks: ${contract.academicWorkload.upcomingTasks.length}, Upcoming Sessions: ${contract.academicWorkload.upcomingSessions.length})`);

    // 6. Test Periodic Analytics (Daily, Weekly, Monthly)
    console.log('\n6️⃣ Testing Periodic Analytics (/api/progress/analytics)...');
    const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
      getJson(`${API_BASE}/progress/analytics?period=daily`, studentToken),
      getJson(`${API_BASE}/progress/analytics?period=weekly`, studentToken),
      getJson(`${API_BASE}/progress/analytics?period=monthly`, studentToken),
    ]);

    const dailyPoints = dailyRes.data;
    const weeklyPoints = weeklyRes.data;
    const monthlyPoints = monthlyRes.data;

    console.log(`   ✅ Daily Points (14 days): ${dailyPoints.length} days returned`);
    console.log(`      Today's point: ${dailyPoints[dailyPoints.length - 1].label} (${dailyPoints[dailyPoints.length - 1].studyHours} hrs, ${dailyPoints[dailyPoints.length - 1].tasksCompleted} tasks)`);
    console.log(`   ✅ Weekly Points (8 weeks): ${weeklyPoints.length} weeks returned`);
    console.log(`   ✅ Monthly Points (6 months): ${monthlyPoints.length} months returned`);

    // 7. Test Single Subject Deep Dive Progress
    console.log('\n7️⃣ Testing Single Subject Deep Dive (/api/progress/subjects/:subjectId)...');
    const subjectProgressRes = await getJson(`${API_BASE}/progress/subjects/${subjectId}`, studentToken);
    const subjData = subjectProgressRes.data;

    console.log(`   ✅ Deep dive retrieved for "${subjData.subject.title}":`);
    console.log(`      Total Topics: ${subjData.summary.totalTopics} (Completed: ${subjData.summary.completedTopics})`);
    console.log(`      Completion Rate: ${subjData.summary.completionRate}%`);
    console.log(`      Subject Study Hours: ${subjData.summary.totalStudyHours} hrs`);
    console.log(`      Topics List length: ${subjData.topics.length}`);

    // 8. Test Teacher Cohort Progress
    console.log('\n8️⃣ Testing Teacher Cohort Progress (/api/progress/teacher/students)...');
    const teacherProgressRes = await getJson(`${API_BASE}/progress/teacher/students`, teacherToken);
    const teacherData = teacherProgressRes.data;

    console.log('   ✅ Teacher Cohort Progress retrieved:');
    console.log(`      Assigned Subjects: ${teacherData.assignedSubjects.length}`);
    console.log(`      Cohort Total Students: ${teacherData.cohortSummary.totalStudents}`);
    console.log(`      Cohort Average Topic Completion: ${teacherData.cohortSummary.averageTopicCompletion}%`);
    console.log(`      Cohort Total Study Hours: ${teacherData.cohortSummary.totalStudyHoursLogged} hrs`);
    if (teacherData.students.length > 0) {
      const s = teacherData.students[0];
      console.log(`      Sample Student: "${s.name}" (${s.studyHours} hrs, ${s.topicCompletionRate}% complete, Status: ${s.status})`);
    }

    // 9. Test Admin Platform Learning Overview
    console.log('\n9️⃣ Testing Admin Platform Overview (/api/progress/admin/overview)...');
    const adminRes = await getJson(`${API_BASE}/progress/admin/overview`, adminToken);
    const adminData = adminRes.data;

    console.log('   ✅ Admin Platform Overview retrieved:');
    console.log(`      Total Platform Users: ${adminData.platformCounts.totalUsers}`);
    console.log(`      Total Students: ${adminData.platformCounts.totalStudents}`);
    console.log(`      Total Platform Study Hours: ${adminData.learningMetrics.totalStudyHours} hrs`);
    console.log(`      Total Sessions Completed: ${adminData.learningMetrics.totalSessionsCompleted}`);
    console.log(`      Total Quiz Attempts: ${adminData.learningMetrics.totalQuizAttempts}`);
    console.log(`      Platform Avg Quiz Score: ${adminData.learningMetrics.platformAverageQuizScore}%`);

    // 10. Clean up test documents
    console.log('\n🔟 Cleaning up test activity documents...');
    await Promise.all([
      deleteJson(`${API_BASE}/study-sessions/${testSessionId}`, studentToken),
      deleteJson(`${API_BASE}/tasks/${testTaskId}`, studentToken),
    ]);
    console.log('   ✅ Test session and task cleanly deleted.\n');

    console.log('🎉 ALL PHASE 9 BACKEND TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err) {
    console.error('❌ Phase 9 Verification Test Failed:', err.message);
    process.exit(1);
  }
}

runPhase9Tests();
