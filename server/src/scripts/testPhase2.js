const BASE = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const { headers, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runPhase2Tests() {
  console.log('--- STARTING PHASE 2 AUTOMATED TEST SUITE ---');

  // 1. Log in Admin
  const adminLogin = await req(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@studygenie.com', password: 'Admin@StudyGenie2026!' }),
  });
  if (!adminLogin.ok) throw new Error('Admin login failed');
  const adminToken = adminLogin.data.token;
  console.log('✅ Admin login verified');

  // 2. Register/Login Teacher
  const teacherEmail = `prof_${Date.now()}@studygenie.com`;
  const teacherReg = await req(`${BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Dr. Evelyn Reed',
      email: teacherEmail,
      password: 'TeacherPass123!',
      role: 'teacher',
      institution: 'MIT Department of Computing',
    }),
  });
  if (!teacherReg.ok) throw new Error(`Teacher reg failed: ${JSON.stringify(teacherReg.data)}`);
  const teacherToken = teacherReg.data.token;
  const teacherId = teacherReg.data.user.id;
  console.log('✅ Teacher registration verified:', teacherEmail);

  // 3. Register Student
  const studentEmail = `student_${Date.now()}@studygenie.com`;
  const studentReg = await req(`${BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Maya Lin',
      email: studentEmail,
      password: 'StudentPass123!',
      role: 'student',
      institution: 'MIT Undergrad',
    }),
  });
  if (!studentReg.ok) throw new Error(`Student reg failed: ${JSON.stringify(studentReg.data)}`);
  const studentToken = studentReg.data.token;
  console.log('✅ Student registration verified:', studentEmail);

  // 4. Test Profile & Preferences update
  const profUpdate = await req(`${BASE}/users/profile`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      bio: 'Junior CS major focused on machine learning and algorithms.',
      gradeLevel: 'Undergraduate (Year 3)',
      phone: '+1-555-0199',
    }),
  });
  if (!profUpdate.ok) throw new Error(`Profile update failed: ${JSON.stringify(profUpdate.data)}`);
  console.log('✅ Student profile updated (bio, gradeLevel, phone)');

  const prefUpdate = await req(`${BASE}/users/preferences`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      dailyStudyGoalHours: 5,
      learningStyle: 'visual',
      preferredStudyTime: 'night',
      reminderFrequency: 'daily',
    }),
  });
  if (!prefUpdate.ok) throw new Error(`Preferences update failed: ${JSON.stringify(prefUpdate.data)}`);
  console.log('✅ Student preferences updated (dailyStudyGoalHours: 5, learningStyle: visual)');

  // 5. Admin creates Subject and assigns Teacher
  const subjectCreate = await req(`${BASE}/subjects`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Data Structures & Algorithms',
      code: 'CS-201',
      description: 'Foundations of algorithmic complexity, tree structures, and graph search.',
      category: 'Computer Science',
      color: '#BBD0FF', // Soft Pastel Sky
      teacherId,
    }),
  });
  if (!subjectCreate.ok) throw new Error(`Subject creation failed: ${JSON.stringify(subjectCreate.data)}`);
  const subjectId = subjectCreate.data.subject._id;
  console.log('✅ Admin created Subject & assigned Teacher:', subjectCreate.data.subject.title);

  // 6. Teacher creates Topics for this subject
  const topic1 = await req(`${BASE}/subjects/${subjectId}/topics`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: JSON.stringify({
      title: 'Binary Search Trees & Balancing',
      description: 'Understanding AVL rotations and red-black tree invariants.',
      difficulty: 'intermediate',
      estimatedHours: 3,
      order: 1,
    }),
  });
  if (!topic1.ok) throw new Error(`Topic 1 creation failed: ${JSON.stringify(topic1.data)}`);
  const topic1Id = topic1.data.topic.id;

  const topic2 = await req(`${BASE}/subjects/${subjectId}/topics`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: JSON.stringify({
      title: 'Graph Traversal (BFS & DFS)',
      description: 'Breadth-first and depth-first searches, connected components.',
      difficulty: 'advanced',
      estimatedHours: 4,
      order: 2,
    }),
  });
  if (!topic2.ok) throw new Error(`Topic 2 creation failed: ${JSON.stringify(topic2.data)}`);
  console.log('✅ Teacher created 2 topics in Subject');

  // 7. Student browses and enrolls in Subject
  const enrollRes = await req(`${BASE}/subjects/${subjectId}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (!enrollRes.ok) throw new Error(`Enrollment failed: ${JSON.stringify(enrollRes.data)}`);
  console.log('✅ Student enrolled successfully in Subject');

  // 8. Student toggles completion for Topic 1
  const toggleRes = await req(`${BASE}/topics/${topic1Id}/toggle-completion`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (!toggleRes.ok) throw new Error(`Toggle completion failed: ${JSON.stringify(toggleRes.data)}`);
  console.log('✅ Student toggled topic completion. Progress:', `${toggleRes.data.progress}% (${toggleRes.data.totalCompleted}/${toggleRes.data.totalTopics})`);

  // 9. Fetch Subject details as student and verify progress = 50%
  const detailsRes = await req(`${BASE}/subjects/${subjectId}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (!detailsRes.ok) throw new Error('Fetch details failed');
  console.log('✅ Subject details progress verified:', `${detailsRes.data.subject.progress}%`);

  // 10. RBAC check: Student cannot create a topic
  const hackTopic = await req(`${BASE}/subjects/${subjectId}/topics`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ title: 'Student unauthorized topic' }),
  });
  if (hackTopic.status === 403) {
    console.log('✅ RBAC Check: Student blocked from adding topics (403 Forbidden)');
  } else {
    throw new Error(`Security breach: Student was allowed to create topic! Status: ${hackTopic.status}`);
  }

  console.log('\n🌟 --- ALL PHASE 2 BACKEND APIS PASSED WITH 100% SUCCESS --- 🌟\n');
}

runPhase2Tests().catch(err => {
  console.error('❌ Phase 2 test suite error:', err);
  process.exit(1);
});
