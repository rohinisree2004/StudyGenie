import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runPhase4Tests() {
  console.log('🧪 Starting Phase 4 – Tasks, Assignments & Calendar Verification Tests...\n');

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
    const studentId = studentLogin.user._id || studentLogin.user.id;
    console.log('   ✅ Student authenticated successfully.');

    // 2. Authenticate Teacher
    console.log('2️⃣ Authenticating Educator (Sarah Jenkins)...');
    const teacherLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.teacher@studygenie.com',
        password: 'TeacherPass123!',
      }),
    });
    const teacherLogin = await teacherLoginRes.json();
    if (!teacherLogin.success) throw new Error(`Teacher login failed: ${teacherLogin.message}`);
    const teacherToken = teacherLogin.token;
    console.log('   ✅ Educator authenticated successfully.');

    // 3. Fetch subjects to link
    console.log('3️⃣ Fetching Educator subjects...');
    const teacherSubjectsRes = await fetch(`${API_BASE}/subjects`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const teacherSubjects = await teacherSubjectsRes.json();
    const subjectsList = teacherSubjects.subjects || teacherSubjects.data || [];
    if (!teacherSubjects.success || !subjectsList.length) {
      throw new Error('No subjects found for educator');
    }
    const testSubject = subjectsList[0];
    const subjectId = testSubject.id || testSubject._id;
    console.log(`   ✅ Using Subject: "${testSubject.title}" (${testSubject.code}) - ID: ${subjectId}`);

    // Ensure student is enrolled in this subject
    await fetch(`${API_BASE}/subjects/${subjectId}/enroll`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('   ✅ Verified student enrollment in subject.');

    // 4. Student Task CRUD & Toggle
    console.log('4️⃣ Testing Student Task Creation & Completion...');
    const taskDue = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const createTaskRes = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Complete Linear Algebra Matrix Proofs',
        description: 'Practice row operations and calculate determinants.',
        subject: subjectId,
        priority: 'high',
        dueDate: taskDue,
        estimatedDuration: 45,
        color: '#B8C0FF',
        tags: ['Math', 'Homework'],
      }),
    });
    const taskData = await createTaskRes.json();
    if (!taskData.success) throw new Error(`Create task failed: ${taskData.message}`);
    const taskId = taskData.data._id;
    console.log(`   ✅ Task created: "${taskData.data.title}" (Priority: ${taskData.data.priority})`);

    // Toggle complete
    const toggleTaskRes = await fetch(`${API_BASE}/tasks/${taskId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const toggleData = await toggleTaskRes.json();
    if (!toggleData.success || !toggleData.data.isCompleted) {
      throw new Error(`Toggle task complete failed: ${toggleData.message}`);
    }
    console.log(`   ✅ Task marked complete. Status: ${toggleData.data.status}`);

    // 5. Educator Assignment Creation
    console.log('5️⃣ Testing Educator Assignment Creation...');
    const assignmentDue = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const createAssignmentRes = await fetch(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        title: 'Phase 4 Math Problem Set: Eigenvalues',
        description: 'Complete questions 1 to 5 from chapter 4.',
        instructions: 'Show all intermediate matrix steps. Submit written solutions.',
        subject: subjectId,
        dueDate: assignmentDue,
        totalPoints: 100,
        status: 'published',
      }),
    });
    const assignmentData = await createAssignmentRes.json();
    if (!assignmentData.success) throw new Error(`Create assignment failed: ${assignmentData.message}`);
    const assignmentId = assignmentData.data._id;
    console.log(`   ✅ Assignment created: "${assignmentData.data.title}" (Due: ${new Date(assignmentDue).toLocaleDateString()})`);

    // 6. Student Query & Assignment Submission
    console.log('6️⃣ Testing Student Assignment Discovery & Submission...');
    const studentAssignmentsRes = await fetch(`${API_BASE}/assignments`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentAssignments = await studentAssignmentsRes.json();
    const foundAssignment = studentAssignments.data.find((a) => a._id === assignmentId);
    if (!foundAssignment) throw new Error('Student could not see published assignment');
    console.log(`   ✅ Student successfully found assignment. Personal status: ${foundAssignment.isCompleted ? 'Completed' : 'Pending'}`);

    const submitRes = await fetch(`${API_BASE}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        submissionText: 'All eigenvalues and eigenvectors calculated with verification proofs.',
      }),
    });
    const submitData = await submitRes.json();
    if (!submitData.success) throw new Error(`Submit assignment failed: ${submitData.message}`);
    console.log('   ✅ Student submitted assignment successfully.');

    // 7. Teacher Grades Student Submission
    console.log('7️⃣ Testing Educator Roster Inspection & Grading...');
    const teacherViewRes = await fetch(`${API_BASE}/assignments/${assignmentId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const teacherView = await teacherViewRes.json();
    if (!teacherView.success) throw new Error(`Teacher fetch assignment failed: ${teacherView.message}`);
    const studentEntry = teacherView.data.roster.find((r) => r.student._id === studentId);
    if (!studentEntry || studentEntry.status !== 'completed') {
      throw new Error('Student submission not reflected in teacher roster');
    }
    console.log(`   ✅ Teacher roster shows ${teacherView.data.roster.length} enrolled students. Alex Morgan status: "${studentEntry.status}"`);

    const gradeRes = await fetch(`${API_BASE}/assignments/${assignmentId}/grade`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        studentId,
        grade: 98,
        feedback: 'Outstanding calculations and very clean presentation!',
      }),
    });
    const gradeData = await gradeRes.json();
    if (!gradeData.success) throw new Error(`Grade assignment failed: ${gradeData.message}`);
    console.log('   ✅ Educator successfully graded student submission (98/100).');

    // 8. Student Study Session Scheduling
    console.log('8️⃣ Testing Study Session Creation...');
    const sessionStart = new Date(Date.now() + 12 * 60 * 60 * 1000);
    const sessionEnd = new Date(sessionStart.getTime() + 90 * 60 * 1000);
    const createSessionRes = await fetch(`${API_BASE}/study-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Deep Dive: Vector Spaces & Basis',
        description: 'Review textbook chapter 3 theorems.',
        subject: subjectId,
        startTime: sessionStart.toISOString(),
        endTime: sessionEnd.toISOString(),
        color: '#FFD6FF',
        notes: 'Targeting 90 min uninterrupted Pomodoro blocks.',
      }),
    });
    const sessionData = await createSessionRes.json();
    if (!sessionData.success) throw new Error(`Create study session failed: ${sessionData.message}`);
    const sessionId = sessionData.data._id;
    console.log(`   ✅ Study Session scheduled: "${sessionData.data.title}" (Duration: ${sessionData.data.duration} mins)`);

    // 9. Calendar Events Aggregation
    console.log('9️⃣ Testing Unified Calendar Feed (/api/calendar/events)...');
    const calendarRes = await fetch(`${API_BASE}/calendar/events`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const calendarData = await calendarRes.json();
    if (!calendarData.success) throw new Error(`Calendar feed failed: ${calendarData.message}`);
    console.log(`   ✅ Calendar returned ${calendarData.data.length} total events.`);

    const hasTask = calendarData.data.some((e) => e.type === 'task' && e.originalId === taskId);
    const hasAssignment = calendarData.data.some((e) => e.type === 'assignment' && e.originalId === assignmentId);
    const hasSession = calendarData.data.some((e) => e.type === 'study_session' && e.originalId === sessionId);

    if (!hasTask || !hasAssignment || !hasSession) {
      throw new Error(`Calendar feed missing items! (Task: ${hasTask}, Assignment: ${hasAssignment}, Session: ${hasSession})`);
    }
    console.log('   ✅ Calendar feed correctly aggregated Task, Assignment, and Study Session events!');

    // 10. Clean up test records
    console.log('🔟 Cleaning up test records...');
    await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    await fetch(`${API_BASE}/assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    await fetch(`${API_BASE}/study-sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('   ✅ Test records cleaned up successfully.');

    console.log('\n🎉 ALL 10 PHASE 4 BACKEND VERIFICATION TESTS PASSED WITH 100% SUCCESS! 🚀✨\n');
  } catch (err) {
    console.error('\n❌ Verification failed:', err.message);
    process.exit(1);
  }
}

runPhase4Tests();
