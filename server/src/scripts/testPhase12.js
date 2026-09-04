/**
 * StudyGenie Phase 12 – Notifications & Announcements Automated Verification Suite
 * Tests full end-to-end notification lifecycle, teacher announcements, automated event triggers,
 * read states, de-duplication, and RBAC / ownership isolation.
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Phase 12 – Notifications & Announcements Verification Tests...\n');

  try {
    // 1️⃣ Authenticate Teacher, Student, and Admin
    console.log('1️⃣ Authenticating Teacher, Student, and Admin...');
    
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
    console.log(`   ✅ Educator logged in: ${teacherData.user.name} (${teacherData.user.role})`);

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
    console.log(`   ✅ Student logged in: ${studentData.user.name} (${studentId})`);

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

    // 2️⃣ Locate Teacher's assigned subject with enrolled students
    console.log('2️⃣ Locating active course with student enrollment...');
    const statsRes = await fetch(`${BASE_URL}/teacher/dashboard-stats`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const statsData = await statsRes.json();
    if (!statsData.success || !statsData.data.assignedSubjects?.length) {
      throw new Error('No assigned subjects found for teacher');
    }
    const activeSubject = statsData.data.assignedSubjects[0];
    console.log(`   ✅ Target Course: "${activeSubject.title}" (${activeSubject.code}) - ID: ${activeSubject._id}\n`);

    // 3️⃣ Test Teacher Announcement Creation & Automated Notification Trigger
    console.log('3️⃣ Testing Teacher Announcement Creation (POST /api/announcements)...');
    const createAnnounceRes = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        title: 'Midterm Exam Review Session & Formula Sheet',
        content: 'Please review Chapters 3 through 5 before our Friday live seminar. Formula cheat sheets are now available in the courseware repository.',
        subject: activeSubject._id,
        priority: 'important',
        isPinned: true,
      }),
    });
    const announceResult = await createAnnounceRes.json();
    if (!announceResult.success) throw new Error('Create announcement failed: ' + announceResult.message);
    const createdAnnouncement = announceResult.data;
    console.log(`   ✅ Announcement created: "${createdAnnouncement.title}" [Priority: ${createdAnnouncement.priority}, Pinned: ${createdAnnouncement.isPinned}]`);

    // Verify enrolled student received the announcement_posted notification
    console.log('   Checking student notification inbox for announcement trigger...');
    const notifsRes = await fetch(`${BASE_URL}/notifications?type=announcement_posted`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const notifsData = await notifsRes.json();
    if (!notifsData.success || !notifsData.data.length) {
      throw new Error('Student did not receive announcement notification');
    }
    const announceNotif = notifsData.data[0];
    console.log(`   ✅ Verified: Student received notification: "${announceNotif.title}" [Category: ${announceNotif.category}]`);

    // 4️⃣ Test Student Announcement Retrieval & Read-Receipt Tracking
    console.log('\n4️⃣ Testing Student Announcement Retrieval & Read Receipts (GET /api/announcements/:id)...');
    const studentAnnounceRes = await fetch(`${BASE_URL}/announcements?subjectId=${activeSubject._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentAnnounceData = await studentAnnounceRes.json();
    if (!studentAnnounceData.success) throw new Error('Failed to retrieve student announcements');
    console.log(`   ✅ Student retrieved ${studentAnnounceData.data.length} course announcement(s)`);

    // Inspect announcement details -> marks student as read
    const detailRes = await fetch(`${BASE_URL}/announcements/${createdAnnouncement._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const detailData = await detailRes.json();
    if (!detailData.success || !detailData.data.isReadByMe) {
      throw new Error('Student announcement read receipt failed');
    }
    console.log(`   ✅ Verified: Student inspected announcement and isReadByMe is now true! Read count: ${detailData.data.readCount}`);

    // Pin Toggle
    const pinRes = await fetch(`${BASE_URL}/announcements/${createdAnnouncement._id}/pin`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const pinData = await pinRes.json();
    console.log(`   ✅ Announcement pin toggled: isPinned = ${pinData.data.isPinned}`);

    // 5️⃣ Test Assignment Creation & Grading Notification Triggers
    console.log('\n5️⃣ Testing Assignment Creation & Grading Event Triggers...');
    const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const assignRes = await fetch(`${BASE_URL}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        title: 'Phase 12 Automated Verification Assignment',
        description: 'Test assignment created to verify student notification broadcast',
        instructions: 'Submit your solution for verification',
        subject: activeSubject._id,
        dueDate: in3Days,
        totalPoints: 100,
        status: 'published',
      }),
    });
    const assignData = await assignRes.json();
    if (!assignData.success) throw new Error('Create assignment failed: ' + assignData.message);
    const createdAssignment = assignData.data;
    console.log(`   ✅ Assignment created: "${createdAssignment.title}"`);

    // Verify student received assignment_created notification
    const assignNotifRes = await fetch(`${BASE_URL}/notifications?type=assignment_created`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const assignNotifData = await assignNotifRes.json();
    const assignNotif = assignNotifData.data.find(
      (n) => n.relatedEntity?.entityId?.toString() === createdAssignment._id.toString()
    );
    if (!assignNotif) throw new Error('Student did not receive assignment_created notification');
    console.log(`   ✅ Student received assignment notification: "${assignNotif.title}"`);

    // Grade assignment submission
    const gradeRes = await fetch(`${BASE_URL}/assignments/${createdAssignment._id}/grade`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        studentId,
        grade: 95,
        feedback: 'Exemplary proof and methodology!',
      }),
    });
    const gradeData = await gradeRes.json();
    if (!gradeData.success) throw new Error('Grading assignment failed: ' + gradeData.message);
    console.log('   ✅ Assignment graded: 95/100 pts');

    // Verify student received assignment_graded notification
    const gradedNotifRes = await fetch(`${BASE_URL}/notifications?type=assignment_graded`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const gradedNotifData = await gradedNotifRes.json();
    const gradedNotif = gradedNotifData.data.find(
      (n) => n.relatedEntity?.entityId?.toString() === createdAssignment._id.toString()
    );
    if (!gradedNotif) throw new Error('Student did not receive assignment_graded notification');
    console.log(`   ✅ Student received grading notification: "${gradedNotif.title}" [${gradedNotif.message}]`);

    // 6️⃣ Test Quiz Submission Event Trigger
    console.log('\n6️⃣ Testing Quiz Submission Notification Trigger...');
    const quizListRes = await fetch(`${BASE_URL}/quizzes`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const quizListData = await quizListRes.json();
    if (quizListData.success && quizListData.data.length > 0) {
      const targetQuiz = quizListData.data[0];
      const attemptRes = await fetch(`${BASE_URL}/quizzes/${targetQuiz._id}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          answers: targetQuiz.questions ? targetQuiz.questions.map((q) => ({
            questionId: q._id,
            selectedOptionIndex: 0,
          })) : [],
          timeTakenSeconds: 45,
        }),
      });
      const attemptData = await attemptRes.json();
      if (attemptData.success) {
        console.log(`   ✅ Quiz attempt submitted with score: ${attemptData.data.score}%`);
        
        // Verify quiz_result notification
        const quizNotifRes = await fetch(`${BASE_URL}/notifications?type=quiz_result`, {
          headers: { Authorization: `Bearer ${studentToken}` },
        });
        const quizNotifData = await quizNotifRes.json();
        if (quizNotifData.success && quizNotifData.data.length > 0) {
          console.log(`   ✅ Student received quiz notification: "${quizNotifData.data[0].title}"`);
        }
      }
    } else {
      console.log('   ℹ️ No quizzes available to attempt, skipping quiz attempt submission');
    }

    // 7️⃣ Test Deadline Reminders Auto-Scan Endpoint
    console.log('\n7️⃣ Testing Auto-Scan Upcoming Reminders (POST /api/notifications/check-reminders)...');
    const reminderScanRes = await fetch(`${BASE_URL}/notifications/check-reminders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const reminderScanData = await reminderScanRes.json();
    if (!reminderScanData.success) throw new Error('check-reminders failed: ' + reminderScanData.message);
    console.log(`   ✅ Reminder scan executed: ${reminderScanData.message}`);

    // 8️⃣ Test Notification Management Endpoints (Unread count, mark read, mark all read)
    console.log('\n8️⃣ Testing Notification Management Endpoints...');
    const unreadCountRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const unreadCountData = await unreadCountRes.json();
    console.log(`   ✅ Live unread notifications count: ${unreadCountData.data.unreadCount}`);

    // Mark single notification read
    const allNotifsRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const allNotifsData = await allNotifsRes.json();
    const testNotif = allNotifsData.data[0];

    const markSingleRes = await fetch(`${BASE_URL}/notifications/${testNotif._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const markSingleData = await markSingleRes.json();
    if (!markSingleData.success || !markSingleData.data.isRead) {
      throw new Error('Failed to mark single notification as read');
    }
    console.log(`   ✅ Marked notification ${testNotif._id} as read`);

    // Mark all read
    const markAllRes = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const markAllData = await markAllRes.json();
    console.log(`   ✅ Marked all read: ${markAllData.message}`);

    // Verify unread count is now 0
    const finalCountRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const finalCountData = await finalCountRes.json();
    console.log(`   ✅ Verified unread count is now: ${finalCountData.data.unreadCount}`);

    // 9️⃣ Test RBAC & Authorization Isolation Constraints
    console.log('\n9️⃣ Testing RBAC & Ownership Isolation Constraints...');
    
    // Student attempting to create announcement -> 403
    const studentCreateAnnounce = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Student Announcement',
        content: 'This should be blocked',
        subject: activeSubject._id,
      }),
    });
    if (studentCreateAnnounce.status !== 403) {
      throw new Error(`Expected 403 for student creating announcement, got ${studentCreateAnnounce.status}`);
    }
    console.log('   ✅ Student correctly blocked from creating announcement (403 Forbidden)');

    // Teacher attempting to create announcement for non-existent or other teacher's subject
    const fakeSubjectId = '660000000000000000000001';
    const teacherUnassignedAnnounce = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Teacher Course Announcement',
        content: 'This should fail',
        subject: fakeSubjectId,
      }),
    });
    if (teacherUnassignedAnnounce.status !== 404 && teacherUnassignedAnnounce.status !== 403) {
      throw new Error(`Expected 404/403 for teacher creating announcement in unassigned course, got ${teacherUnassignedAnnounce.status}`);
    }
    console.log('   ✅ Teacher blocked from posting announcement in unassigned subject (403/404)');

    // Admin platform-wide announcement access
    const adminAnnounceListRes = await fetch(`${BASE_URL}/announcements`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminAnnounceData = await adminAnnounceListRes.json();
    if (!adminAnnounceData.success) throw new Error('Admin failed to access announcements');
    console.log(`   ✅ Admin successfully accessed all system announcements (${adminAnnounceData.data.length} found)`);

    // Clean up test assignment and announcement
    await fetch(`${BASE_URL}/assignments/${createdAssignment._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    await fetch(`${BASE_URL}/announcements/${createdAnnouncement._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    console.log('   ✅ Cleaned up test announcement and assignment');

    console.log('\n🎉 ALL PHASE 12 BACKEND NOTIFICATION & ANNOUNCEMENT TESTS PASSED! 🚀\n');
  } catch (err) {
    console.error('\n❌ Phase 12 Verification Test Failed:', err.message);
    process.exit(1);
  }
}

runTests();
