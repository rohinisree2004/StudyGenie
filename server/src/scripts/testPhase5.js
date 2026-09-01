import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runPhase5Tests() {
  console.log('🧪 Starting Phase 5 – AI-Powered Study Planner Verification Tests...\n');

  try {
    // 1. Authenticate Student
    console.log('1️⃣ Authenticating Student (Alex Morgan)...');
    const studentLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.student@studygenie.com',
        password: 'StudentPass123!',
      }),
    });
    const studentLogin = await studentLoginRes.json();
    if (!studentLogin.success) throw new Error(`Student login failed: ${studentLogin.message}`);
    const studentToken = studentLogin.token;
    console.log('   ✅ Student authenticated successfully.');

    // 2. Fetch student's enrolled subjects
    console.log('2️⃣ Fetching enrolled subjects...');
    const subjectsRes = await fetch(`${API_BASE}/subjects`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const subjectsData = await subjectsRes.json();
    const subjectsList = subjectsData.subjects || subjectsData.data || [];
    if (!subjectsList.length) throw new Error('No enrolled subjects found for student');
    const testSubject = subjectsList[0];
    const subjectId = testSubject.id || testSubject._id;
    console.log(`   ✅ Using Subject: "${testSubject.title}" (${testSubject.code || 'MATH'}) - ID: ${subjectId}`);

    // 3. Generate AI Study Plan
    console.log('3️⃣ Generating AI Study Plan via Gemini Engine...');
    const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const generateRes = await fetch(`${API_BASE}/study-plans/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        goal: 'Ace Linear Algebra Midterm and Master Eigenvector Proofs',
        subjects: [subjectId],
        startDate,
        endDate,
        dailyStudyHours: 2,
        preferredStudyTime: 'evening',
        intensity: 'balanced',
      }),
    });
    const generateData = await generateRes.json();
    if (!generateData.success) throw new Error(`Generate plan failed: ${generateData.message}`);

    const plan = generateData.data;
    const planId = plan._id;
    console.log(`   ✅ AI Study Plan generated: "${plan.title}"`);
    console.log(`      Sessions scheduled: ${plan.sessions.length} sessions across window`);
    console.log(`      Total planned study: ${plan.summary.totalHours} hours`);
    console.log(`      AI Engine: ${plan.aiModel}`);

    // Verify session structure
    const sampleSession = plan.sessions[0];
    if (!sampleSession || !sampleSession.title || !sampleSession.startTime || !sampleSession.color) {
      throw new Error('Study session structure is invalid');
    }
    console.log(`   ✅ Sample session verified: "${sampleSession.title}" (${sampleSession.duration}m at ${sampleSession.color})`);

    // 4. Retrieve Plans
    console.log('4️⃣ Testing Fetch Study Plans List & Detail...');
    const listRes = await fetch(`${API_BASE}/study-plans`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const listData = await listRes.json();
    if (!listData.success || !listData.data.some((p) => p._id === planId)) {
      throw new Error('Newly created plan not found in user study plans list');
    }
    console.log(`   ✅ Retrieved ${listData.count} study plans for student.`);

    // 5. Apply Plan to Calendar
    console.log('5️⃣ Testing Apply to Calendar (/api/study-plans/:id/apply-to-calendar)...');
    const applyRes = await fetch(`${API_BASE}/study-plans/${planId}/apply-to-calendar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const applyData = await applyRes.json();
    if (!applyData.success || !applyData.data.appliedToCalendar) {
      throw new Error(`Apply to calendar failed: ${applyData.message}`);
    }
    console.log(`   ✅ Plan applied to Calendar! Created ${applyData.sessionsCreated} StudySession records.`);

    // 6. Verify Calendar Integration
    console.log('6️⃣ Verifying sessions in Calendar Feed (/api/calendar/events)...');
    const calendarRes = await fetch(`${API_BASE}/calendar/events?types=study_sessions`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const calendarData = await calendarRes.json();
    if (!calendarData.success) throw new Error(`Calendar feed error: ${calendarData.message}`);

    const firstSessionId = applyData.data.sessions[0].studySessionId;
    const foundInCalendar = calendarData.data.some((e) => e.originalId === firstSessionId);
    if (!foundInCalendar) throw new Error('Applied study session not found in calendar events feed');
    console.log('   ✅ Verified: AI Study Sessions successfully visible in student Calendar feed!');

    // 7. Toggle Session Completion
    console.log('7️⃣ Testing Plan Session Completion Toggle...');
    const targetSession = applyData.data.sessions[0];
    const toggleRes = await fetch(`${API_BASE}/study-plans/${planId}/sessions/${targetSession._id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const toggleData = await toggleRes.json();
    if (!toggleData.success) throw new Error(`Toggle session failed: ${toggleData.message}`);

    const updatedSession = toggleData.data.sessions.find((s) => s._id === targetSession._id);
    if (!updatedSession.isCompleted) throw new Error('Session isCompleted flag did not toggle to true');
    console.log(`   ✅ Session completion toggled. New plan completion rate: ${toggleData.data.summary.completionRate}%`);

    // 8. Clean up test records
    console.log('8️⃣ Cleaning up test study plan and calendar sessions...');
    const deleteRes = await fetch(`${API_BASE}/study-plans/${planId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const deleteData = await deleteRes.json();
    if (!deleteData.success) throw new Error(`Delete plan failed: ${deleteData.message}`);
    console.log('   ✅ Test study plan and linked calendar sessions cleaned up successfully.');

    console.log('\n🎉 ALL 8 PHASE 5 BACKEND VERIFICATION TESTS PASSED WITH 100% SUCCESS! 🚀🧠✨\n');
  } catch (err) {
    console.error('\n❌ Verification failed:', err.message);
    process.exit(1);
  }
}

runPhase5Tests();
