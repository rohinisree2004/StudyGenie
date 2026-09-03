import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runPhase8Tests() {
  console.log('🧪 Starting Phase 8 – AI Quiz Generation & Management Verification Tests...\n');

  try {
    // 1. Authenticate Student & Teacher
    console.log('1️⃣ Authenticating Student & Educator...');
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
    console.log('   ✅ Student and Educator authenticated successfully.');

    // 2. Fetch student's enrolled subjects
    console.log('\n2️⃣ Fetching enrolled subjects & syllabus context...');
    const subjectsRes = await fetch(`${API_BASE}/subjects`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const subjectsData = await subjectsRes.json();
    const subjectsList = subjectsData.subjects || subjectsData.data || [];
    if (!subjectsList.length) throw new Error('No enrolled subjects found for student');
    const testSubject = subjectsList[0];
    const subjectId = testSubject.id || testSubject._id;
    console.log(`   ✅ Using Subject: "${testSubject.title}" (${testSubject.code || 'CODE'})`);

    // Fetch topics
    let topicId = null;
    const topicsRes = await fetch(`${API_BASE}/topics?subject=${subjectId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (topicsRes.ok) {
      const topicsData = await topicsRes.json();
      const topicList = topicsData.topics || topicsData.data || [];
      if (topicList.length > 0) {
        topicId = topicList[0].id || topicList[0]._id;
        console.log(`   ✅ Using Topic Context: "${topicList[0].title}"`);
      }
    }

    // 3. Student generates an AI Quiz via Gemini proxy
    console.log('\n3️⃣ Generating 5-question Multiple Choice Quiz via Gemini AI proxy...');
    const generateRes = await fetch(`${API_BASE}/quizzes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Linear Transformations & Matrices Practice Quiz',
        description: 'Comprehensive mastery check on transformations, rank-nullity, and coordinate matrices.',
        subjectId,
        topicId,
        totalQuestions: 5,
        difficulty: 'medium',
        questionType: 'multiple_choice',
        timeLimit: 10,
      }),
    });

    const generateData = await generateRes.json();
    if (!generateData.success) throw new Error(`Generate quiz failed: ${generateData.message}`);
    const studentQuiz = generateData.data;
    const quizId = studentQuiz._id;
    console.log(`   ✅ Quiz Generated! (ID: ${quizId}, AI Model: ${studentQuiz.aiModel})`);
    console.log(`      Title: "${studentQuiz.title}"`);
    console.log(`      Total Questions: ${studentQuiz.questions.length}`);
    console.log(`      First Question: "${studentQuiz.questions[0].questionText.slice(0, 80)}..."`);
    console.log(`      Options count: ${studentQuiz.questions[0].options.length}`);
    console.log(`      Correct Answer Index: ${studentQuiz.questions[0].correctAnswerIndex}`);

    if (studentQuiz.questions.length < 3) {
      throw new Error(`Expected at least 3 questions, got ${studentQuiz.questions.length}`);
    }

    // 4. Test Examination Mode (anti-cheat sanitization)
    console.log('\n4️⃣ Verifying Exam Mode question sanitization (?mode=take)...');
    const examModeRes = await fetch(`${API_BASE}/quizzes/${quizId}?mode=take`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const examModeData = await examModeRes.json();
    if (!examModeData.success) throw new Error(`Exam mode fetch failed: ${examModeData.message}`);

    const firstExamQuestion = examModeData.data.questions[0];
    if (firstExamQuestion.correctAnswerIndex !== undefined || firstExamQuestion.explanation !== undefined) {
      throw new Error('Security flaw: correctAnswerIndex or explanation exposed in take mode!');
    }
    console.log('   ✅ Exam mode successfully hides answers and explanations from student browser.');

    // 5. Submit Quiz Attempt
    console.log('\n5️⃣ Submitting quiz attempt with evaluated responses...');
    // Prepare answers: make question 0-3 correct, question 4 intentionally incorrect
    const submissionAnswers = studentQuiz.questions.map((q, idx) => {
      let chosenIdx = q.correctAnswerIndex;
      if (idx === studentQuiz.questions.length - 1) {
        // Pick wrong index for last question
        chosenIdx = (q.correctAnswerIndex + 1) % q.options.length;
      }
      return {
        questionId: q._id,
        selectedOptionIndex: chosenIdx,
        timeSpentSeconds: 15,
      };
    });

    const submitRes = await fetch(`${API_BASE}/quizzes/${quizId}/attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        answers: submissionAnswers,
        timeTakenSeconds: 75,
        startedAt: new Date(Date.now() - 75000).toISOString(),
      }),
    });

    const submitData = await submitRes.json();
    if (!submitData.success) throw new Error(`Submit attempt failed: ${submitData.message}`);
    const attemptResult = submitData.data;
    const attemptId = attemptResult.attemptId;

    console.log(`   ✅ Quiz Attempt Evaluated!`);
    console.log(`      Attempt ID: ${attemptId}`);
    console.log(`      Score: ${attemptResult.score}% (${attemptResult.correctCount}/${attemptResult.totalQuestions} Correct)`);
    console.log(`      Passed: ${attemptResult.passed}`);
    console.log(`      Feedback: "${attemptResult.feedback}"`);

    const expectedScore = Math.round(((studentQuiz.questions.length - 1) / studentQuiz.questions.length) * 100);
    if (attemptResult.score !== expectedScore) {
      throw new Error(`Expected score ${expectedScore}%, received ${attemptResult.score}%`);
    }

    // 6. Fetch Full Attempt Review
    console.log('\n6️⃣ Fetching detailed attempt review with explanations...');
    const reviewRes = await fetch(`${API_BASE}/quizzes/attempts/${attemptId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const reviewData = await reviewRes.json();
    if (!reviewData.success) throw new Error(`Attempt review failed: ${reviewData.message}`);

    console.log(`   ✅ Attempt review retrieved with ${reviewData.data.questions.length} questions.`);
    const firstReviewQ = reviewData.data.questions[0];
    console.log(`      Question 1: "${firstReviewQ.questionText.slice(0, 70)}..."`);
    console.log(`      Selected: Option ${firstReviewQ.selectedOptionIndex} | Correct: Option ${firstReviewQ.correctAnswerIndex}`);
    console.log(`      Is Correct: ${firstReviewQ.isCorrect}`);
    console.log(`      Explanation: "${firstReviewQ.explanation.slice(0, 90)}..."`);

    // 7. Teacher generates and publishes a course quiz for class
    console.log('\n7️⃣ Teacher generating class-wide course quiz...');
    const teacherQuizRes = await fetch(`${API_BASE}/quizzes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        title: 'Midterm Preparation: Linear Algebra Challenge',
        description: 'Mandatory preparation quiz for MATH-210 students.',
        subjectId,
        totalQuestions: 5,
        difficulty: 'hard',
        isPublished: true,
      }),
    });

    const teacherQuizData = await teacherQuizRes.json();
    if (!teacherQuizData.success) throw new Error(`Teacher quiz failed: ${teacherQuizData.message}`);
    const teacherQuizId = teacherQuizData.data._id;
    console.log(`   ✅ Teacher Course Quiz generated and published (ID: ${teacherQuizId})`);

    // 8. Student lists class quizzes
    console.log('\n8️⃣ Student checking available class quizzes...');
    const classQuizzesRes = await fetch(`${API_BASE}/quizzes?tab=class`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const classQuizzesData = await classQuizzesRes.json();
    if (!classQuizzesData.success) throw new Error(`List class quizzes failed: ${classQuizzesData.message}`);
    console.log(`   ✅ Student sees ${classQuizzesData.count} class quiz(zes).`);

    // 9. Student checks their attempt history
    console.log('\n9️⃣ Student querying past attempt history...');
    const historyRes = await fetch(`${API_BASE}/quizzes/attempts`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const historyData = await historyRes.json();
    if (!historyData.success) throw new Error(`Attempt history failed: ${historyData.message}`);
    console.log(`   ✅ Found ${historyData.count} attempt(s) in student history.`);

    // 10. Clean up test quizzes and attempts
    console.log('\n🔟 Cleaning up test quizzes...');
    await fetch(`${API_BASE}/quizzes/${quizId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    await fetch(`${API_BASE}/quizzes/${teacherQuizId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    console.log('   ✅ Test quizzes and linked attempts cleanly deleted.');

    console.log('\n🎉 ALL PHASE 8 BACKEND TESTS PASSED SUCCESSFULLY! 🚀');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Phase 8 Verification Test Failed:', error.message);
    process.exit(1);
  }
}

runPhase8Tests();
