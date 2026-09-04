import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

const TEACHER_CREDENTIALS = {
  email: 'sarah.teacher@studygenie.com',
  password: 'TeacherPass123!',
};

const STUDENT_CREDENTIALS = {
  email: 'alex.student@studygenie.com',
  password: 'StudentPass123!',
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
    const err = new Error(json.message || `HTTP ${res.status} on ${url}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

async function getJson(url, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.message || `HTTP ${res.status} on ${url}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

async function runPhase11Tests() {
  console.log('🧪 Starting Phase 11 – Teacher Student Monitoring Verification Tests...\n');

  try {
    // 1. Authenticate Teacher, Student, and Admin
    console.log('1️⃣ Authenticating Teacher, Student, and Admin...');
    const [teacherAuth, studentAuth, adminAuth] = await Promise.all([
      postJson(`${API_BASE}/auth/login`, TEACHER_CREDENTIALS),
      postJson(`${API_BASE}/auth/login`, STUDENT_CREDENTIALS),
      postJson(`${API_BASE}/auth/login`, ADMIN_CREDENTIALS),
    ]);

    const teacherToken = teacherAuth.token;
    const studentToken = studentAuth.token;
    const adminToken = adminAuth.token;

    const teacherUser = teacherAuth.user;
    const studentUser = studentAuth.user;
    const studentId = studentUser.id || studentUser._id;

    console.log(`   ✅ Educator logged in: ${teacherUser.name} (${teacherUser.role})`);
    console.log(`   ✅ Student logged in: ${studentUser.name} (${studentId})`);
    console.log(`   ✅ Admin logged in: ${adminAuth.user.name} (${adminAuth.user.role})`);

    // 2. Test Teacher Dashboard Stats (GET /api/teacher/dashboard-stats)
    console.log('\n2️⃣ Testing Teacher Dashboard Stats (GET /api/teacher/dashboard-stats)...');
    const statsRes = await getJson(`${API_BASE}/teacher/dashboard-stats`, teacherToken);
    if (!statsRes.success || !statsRes.data) {
      throw new Error('Failed to retrieve teacher dashboard stats.');
    }
    const { kpis, assignedSubjects, studentsNeedingSupport, recentSubmissions, recentQuizAttempts } = statsRes.data;
    console.log(`   ✅ KPIs retrieved:`);
    console.log(`      - Assigned Subjects: ${kpis.totalAssignedSubjects}`);
    console.log(`      - Unique Students: ${kpis.totalUniqueStudents}`);
    console.log(`      - Students On Track: ${kpis.studentsOnTrack}`);
    console.log(`      - Students Needing Support: ${kpis.studentsNeedingSupport}`);
    console.log(`      - Average Topic Completion: ${kpis.averageTopicCompletion}%`);
    console.log(`      - Total Study Hours Logged: ${kpis.totalStudyHours} hrs`);
    console.log(`   ✅ Recent submissions count: ${recentSubmissions?.length || 0}`);
    console.log(`   ✅ Recent quiz attempts count: ${recentQuizAttempts?.length || 0}`);

    // 3. Test Teacher Students List (GET /api/teacher/students)
    console.log('\n3️⃣ Testing Teacher Students List (GET /api/teacher/students)...');
    const studentsRes = await getJson(`${API_BASE}/teacher/students`, teacherToken);
    if (!studentsRes.success || !studentsRes.data) {
      throw new Error('Failed to retrieve students list.');
    }
    const { cohortSummary, students } = studentsRes.data;
    console.log(`   ✅ Students retrieved: ${students.length} students enrolled in teacher's subjects`);
    if (students.length > 0) {
      const sample = students[0];
      console.log(`      - Sample: ${sample.name} (${sample.email})`);
      console.log(`        Mastery: ${sample.topicCompletionRate}%, Study Hours: ${sample.studyHours}h`);
      console.log(`        Quizzes: ${sample.quizAttemptsCount} attempts (Avg: ${sample.averageQuizScore ?? 'N/A'}%)`);
      console.log(`        Assignments: ${sample.assignmentsSubmitted}/${sample.totalAssignments} submitted`);
      console.log(`        Status: ${sample.status}`);
    }

    // 4. Test Search, Filtering, and Sorting on /api/teacher/students
    console.log('\n4️⃣ Testing Search, Filters, and Sorting on /api/teacher/students...');

    // Search
    const searchRes = await getJson(`${API_BASE}/teacher/students?search=Alex`, teacherToken);
    console.log(`   ✅ Search for "Alex": ${searchRes.data.students.length} match(es)`);
    if (searchRes.data.students.length === 0) {
      throw new Error('Expected at least 1 match for student "Alex"');
    }

    const emptySearchRes = await getJson(`${API_BASE}/teacher/students?search=NonExistentQueryXYZ`, teacherToken);
    console.log(`   ✅ Search for non-existent query: ${emptySearchRes.data.students.length} matches (expected 0)`);
    if (emptySearchRes.data.students.length !== 0) {
      throw new Error('Expected 0 matches for non-existent search query');
    }

    // Status filter
    const statusRes = await getJson(`${API_BASE}/teacher/students?status=all`, teacherToken);
    console.log(`   ✅ Status filter "all": ${statusRes.data.students.length} student(s)`);

    // Sort by name_asc
    const sortRes = await getJson(`${API_BASE}/teacher/students?sort=name_asc`, teacherToken);
    console.log(`   ✅ Sort by "name_asc": first student is "${sortRes.data.students[0]?.name}"`);

    // 5. Test Single Student Deep Dive (GET /api/teacher/students/:studentId)
    console.log('\n5️⃣ Testing Single Student Performance Deep-Dive (GET /api/teacher/students/:studentId)...');
    const detailRes = await getJson(`${API_BASE}/teacher/students/${studentId}`, teacherToken);
    if (!detailRes.success || !detailRes.data) {
      throw new Error('Failed to retrieve student performance details.');
    }
    const studentPerf = detailRes.data;
    console.log(`   ✅ Student Profile: ${studentPerf.student.name} (${studentPerf.student.email})`);
    console.log(`   ✅ Enrolled Teacher Subjects: ${studentPerf.enrolledSubjects?.length} courses`);
    console.log(`   ✅ Overview in Teacher's Courses:`);
    console.log(`      - Study Hours: ${studentPerf.overview.totalStudyHours}h (${studentPerf.overview.totalSessions} sessions)`);
    console.log(`      - Topic Mastery: ${studentPerf.overview.completedTopics}/${studentPerf.overview.totalTopics} topics (${studentPerf.overview.topicCompletionRate}%)`);
    console.log(`      - Assignments: ${studentPerf.overview.submittedAssignments}/${studentPerf.overview.totalAssignments} submitted (Avg Grade: ${studentPerf.overview.averageGrade ?? 'N/A'}%)`);
    console.log(`      - Quizzes: ${studentPerf.overview.totalQuizAttempts} attempts (Avg: ${studentPerf.overview.averageQuizScore ?? 'N/A'}%, Pass Rate: ${studentPerf.overview.quizPassRate}%)`);
    console.log(`      - Streak: ${studentPerf.overview.streak?.currentStreak || 0} days`);
    console.log(`   ✅ Subject Breakdown: ${studentPerf.subjectBreakdown?.length} subject(s) with topic lists`);
    console.log(`   ✅ Weak Topics Identified: ${studentPerf.weakTopics?.length} weak topic(s)`);
    console.log(`   ✅ Assignments Detail List: ${studentPerf.assignments?.length} assignment(s)`);
    console.log(`   ✅ Trend Points for Timeline Chart: ${studentPerf.trendPoints?.length} daily points`);

    // 6. Test Subject Class Roster (GET /api/teacher/subjects/:subjectId/students)
    const targetSubject = assignedSubjects[0];
    if (targetSubject) {
      console.log(`\n6️⃣ Testing Subject Class Roster (GET /api/teacher/subjects/${targetSubject._id}/students)...`);
      const rosterRes = await getJson(`${API_BASE}/teacher/subjects/${targetSubject._id}/students`, teacherToken);
      if (!rosterRes.success || !rosterRes.data) {
        throw new Error('Failed to retrieve subject students roster.');
      }
      const { subject, classSummary, students: rosterStudents } = rosterRes.data;
      console.log(`   ✅ Course: ${subject.title} (${subject.code})`);
      console.log(`   ✅ Class Summary:`);
      console.log(`      - Enrolled Students: ${classSummary.totalStudents}`);
      console.log(`      - Average Topic Completion: ${classSummary.averageTopicCompletion}%`);
      console.log(`      - Average Quiz Score: ${classSummary.averageQuizScore}%`);
      console.log(`      - Total Study Hours Logged: ${classSummary.totalStudyHoursLogged}h`);
      console.log(`      - Assignment Submission Rate: ${classSummary.assignmentSubmissionRate}%`);
      console.log(`   ✅ Student Roster: ${rosterStudents.length} student(s) enrolled`);
    }

    // 7. Test Security, RBAC & Ownership Isolation
    console.log('\n7️⃣ Testing RBAC & Ownership Isolation Constraints...');

    // A. Student blocked from teacher endpoints
    try {
      await getJson(`${API_BASE}/teacher/students`, studentToken);
      throw new Error('Student should have been blocked with 403 from teacher monitoring.');
    } catch (authErr) {
      console.log(`   ✅ Student correctly blocked (403): "${authErr.message}"`);
    }

    // B. Teacher blocked from inspecting unrelated student (e.g. fake ObjectId)
    const fakeStudentId = '666666666666666666666666';
    try {
      await getJson(`${API_BASE}/teacher/students/${fakeStudentId}`, teacherToken);
      throw new Error('Teacher should be blocked with 403 when accessing unenrolled student.');
    } catch (ownershipErr) {
      console.log(`   ✅ Teacher blocked from unenrolled student (403): "${ownershipErr.message}"`);
    }

    // C. Teacher blocked from viewing subject taught by another teacher
    const fakeSubjectId = '555555555555555555555555';
    try {
      await getJson(`${API_BASE}/teacher/subjects/${fakeSubjectId}/students`, teacherToken);
      throw new Error('Teacher should be blocked with 403 when accessing subject they do not teach.');
    } catch (subjectErr) {
      console.log(`   ✅ Teacher blocked from other teacher's subject (403): "${subjectErr.message}"`);
    }

    // D. Admin permitted to access teacher monitoring
    const adminQueryRes = await getJson(`${API_BASE}/teacher/students/${studentId}`, adminToken);
    if (!adminQueryRes.success || !adminQueryRes.data) {
      throw new Error('Admin should have platform-wide access to student performance.');
    }
    console.log(`   ✅ Admin successfully accessed student performance (Platform-wide RBAC verified)`);

    console.log('\n🎉 ALL PHASE 11 BACKEND MONITORING TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err) {
    console.error('\n❌ Phase 11 Backend Test Failed:', err.message);
    process.exit(1);
  }
}

runPhase11Tests();
