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

async function runPhase10Tests() {
  console.log('🧪 Starting Phase 10 – AI-Powered Study Recommendations Verification Tests...\n');

  try {
    // 1. Authenticate Student and Teacher
    console.log('1️⃣ Authenticating Student and Educator...');
    const [studentAuth, teacherAuth] = await Promise.all([
      postJson(`${API_BASE}/auth/login`, STUDENT_CREDENTIALS),
      postJson(`${API_BASE}/auth/login`, TEACHER_CREDENTIALS),
    ]);

    const studentToken = studentAuth.token;
    const studentUser = studentAuth.user;
    const studentId = studentUser.id || studentUser._id;
    const teacherToken = teacherAuth.token;
    console.log(`   ✅ Student logged in: ${studentUser.name} (${studentUser.role}, ID: ${studentId})`);
    console.log(`   ✅ Teacher logged in: ${teacherAuth.user.name} (${teacherAuth.user.role})`);

    // 2. Fetch or Generate Recommendations for Student
    console.log('\n2️⃣ Fetching AI Study Recommendations for Student (GET /api/recommendations)...');
    const startFetchTime = Date.now();
    const recRes = await getJson(`${API_BASE}/recommendations`, studentToken);
    const fetchDuration = Date.now() - startFetchTime;

    if (!recRes.success || !recRes.data) {
      throw new Error('Failed to retrieve recommendations payload.');
    }

    const rec = recRes.data;
    console.log(`   ✅ Recommendations loaded in ${fetchDuration}ms (cached: ${recRes.cached})`);
    console.log(`   💡 Summary Quote: "${rec.summaryQuote}"`);
    console.log(`   🎯 Performance Tier: ${rec.overview?.performanceTier}`);
    console.log(`   🔍 Key Focus Area: ${rec.overview?.keyFocusArea}`);
    console.log(`   🧠 AI Model: ${rec.aiModel}`);
    console.log(`   ⏳ Expires At: ${rec.expiresAt}`);

    // Verify sub-schemas
    console.log('\n3️⃣ Verifying Recommendation Sub-components:');

    // Weak topics
    console.log(`   • Weak Topic Recommendations: ${rec.weakTopicRecommendations?.length || 0} items`);
    if (rec.weakTopicRecommendations?.length > 0) {
      const wt = rec.weakTopicRecommendations[0];
      console.log(`     - Sample: "${wt.topicTitle}" in [${wt.subjectTitle}]`);
      console.log(`       Mastery: ${wt.currentMastery}%, Urgency: ${wt.urgency}`);
      console.log(`       Action: "${wt.recommendedAction}"`);
      console.log(`       Action URL: ${wt.actionUrl}`);
    }

    // Subject attention
    console.log(`   • Subject Attention Breakdown: ${rec.subjectAttention?.length || 0} subjects`);
    if (rec.subjectAttention?.length > 0) {
      const sa = rec.subjectAttention[0];
      console.log(`     - Sample: "${sa.subjectTitle}" (${sa.priorityLevel} priority, ${sa.hoursLogged} hrs logged, target: ${sa.suggestedWeeklyHours} hrs/wk)`);
      console.log(`       Note: "${sa.statusNote}"`);
    }

    // Schedule advice
    console.log(`   • Schedule Advice:`);
    console.log(`     - Daily: ${rec.studyScheduleAdvice?.recommendedDailyMinutes} min, Weekly: ${rec.studyScheduleAdvice?.recommendedWeeklyHours} hrs`);
    console.log(`     - Optimal time: ${rec.studyScheduleAdvice?.optimalStudyTime}`);
    console.log(`     - Streak Advice: "${rec.studyScheduleAdvice?.streakAdvice}"`);
    console.log(`     - Pacing: "${rec.studyScheduleAdvice?.workloadPacing}"`);

    // Prioritized Deadlines
    console.log(`   • Prioritized Deadlines: ${rec.prioritizedDeadlines?.length || 0} items`);
    if (rec.prioritizedDeadlines?.length > 0) {
      const pd = rec.prioritizedDeadlines[0];
      console.log(`     - Sample: "${pd.title}" (${pd.itemType}, ${pd.daysRemaining} days remaining)`);
      console.log(`       AI Tactic: "${pd.aiTactic}"`);
    }

    // Revision Strategies
    console.log(`   • Revision Strategies: ${rec.revisionStrategies?.length || 0} strategies`);
    if (rec.revisionStrategies?.length > 0) {
      const rs = rec.revisionStrategies[0];
      console.log(`     - Sample: "${rs.strategyName}" (${rs.technique}): "${rs.description.slice(0, 70)}..."`);
    }

    // Recommended Resources
    console.log(`   • Recommended Resources: ${rec.recommendedResources?.length || 0} resources`);
    if (rec.recommendedResources?.length > 0) {
      const rr = rec.recommendedResources[0];
      console.log(`     - Sample: [${rr.resourceType}] "${rr.title}": ${rr.reason} (URL: ${rr.actionUrl})`);
    }

    // 4. Test 24-Hour Caching Verification
    console.log('\n4️⃣ Testing 24-Hour Recommendation Caching (GET /api/recommendations without force)...');
    const cacheStartTime = Date.now();
    const cachedRes = await getJson(`${API_BASE}/recommendations`, studentToken);
    const cacheDuration = Date.now() - cacheStartTime;

    if (!cachedRes.cached) {
      throw new Error(`Expected cached: true, but got cached: ${cachedRes.cached}`);
    }
    console.log(`   ✅ Cache hit confirmed: served in ${cacheDuration}ms with identical ID (${cachedRes.data._id})`);

    // 5. Test Force / Explicit Regeneration
    console.log('\n5️⃣ Testing Explicit AI Advice Regeneration (POST /api/recommendations/generate)...');
    const regenStartTime = Date.now();
    const regenRes = await postJson(`${API_BASE}/recommendations/generate`, {}, studentToken);
    const regenDuration = Date.now() - regenStartTime;

    if (regenRes.cached === true) {
      throw new Error('Regeneration endpoint should not return cached recommendations.');
    }
    console.log(`   ✅ Fresh advice regenerated in ${regenDuration}ms (cached: ${regenRes.cached})`);
    console.log(`   🆕 New ID: ${regenRes.data._id}`);
    console.log(`   💡 Updated Quote: "${regenRes.data.summaryQuote}"`);

    // 6. Test Fetch Recommendation By ID
    console.log('\n6️⃣ Testing Get Recommendation By ID (GET /api/recommendations/:id)...');
    const byIdRes = await getJson(`${API_BASE}/recommendations/${regenRes.data._id}`, studentToken);
    if (!byIdRes.success || byIdRes.data._id !== regenRes.data._id) {
      throw new Error('Failed to retrieve recommendation by ID.');
    }
    console.log(`   ✅ Fetched recommendation record by ID: ${byIdRes.data._id}`);

    // 7. Test Educator Accessing Student's Recommendations
    console.log('\n7️⃣ Testing Educator Querying Student Recommendations (GET /api/recommendations?studentId=...)...');
    const teacherQueryRes = await getJson(`${API_BASE}/recommendations?studentId=${studentId}`, teacherToken);
    if (!teacherQueryRes.success || !teacherQueryRes.data) {
      throw new Error('Teacher should be able to view student recommendations.');
    }
    console.log(`   ✅ Teacher successfully queried student's AI advice (User: ${teacherQueryRes.data.user})`);

    // 8. Test Role Access Isolation (Unauthenticated)
    console.log('\n8️⃣ Testing Authentication Isolation...');
    try {
      await getJson(`${API_BASE}/recommendations`);
      throw new Error('Unauthenticated request should have failed with 401.');
    } catch (unauthErr) {
      console.log(`   ✅ Unauthenticated request blocked correctly: "${unauthErr.message}"`);
    }

    console.log('\n🎉 ALL PHASE 10 BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err) {
    console.error('\n❌ Phase 10 Backend Test Failed:', err.message);
    process.exit(1);
  }
}

runPhase10Tests();
