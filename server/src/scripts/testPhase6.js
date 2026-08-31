import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runPhase6Tests() {
  console.log('🧪 Starting Phase 6 – AI Learning Assistant Verification Tests...\n');

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

    // 2. Fetch student's enrolled subjects & topics
    console.log('2️⃣ Fetching enrolled subjects and topics for context...');
    const subjectsRes = await fetch(`${API_BASE}/subjects`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const subjectsData = await subjectsRes.json();
    const subjectsList = subjectsData.subjects || subjectsData.data || [];
    if (!subjectsList.length) throw new Error('No enrolled subjects found for student');
    const testSubject = subjectsList[0];
    const subjectId = testSubject.id || testSubject._id;
    console.log(`   ✅ Using Subject Context: "${testSubject.title}" (${testSubject.code || 'CODE'})`);

    // Fetch topics for this subject if available
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

    // 3. Send initial academic question to AI Assistant
    console.log('3️⃣ Sending initial academic query to AI Assistant via backend Gemini proxy...');
    const initialQuestion = 'Can you explain the intuition behind this topic with a simple real-world analogy and key points?';
    
    const sendRes1 = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        message: initialQuestion,
        subjectId,
        topicId,
      }),
    });

    const sendData1 = await sendRes1.json();
    if (!sendData1.success) throw new Error(`Initial chat failed: ${sendData1.message}`);

    const conversationId = sendData1.data.conversationId;
    console.log(`   ✅ Initial Response received!`);
    console.log(`      Conversation ID: ${conversationId}`);
    console.log(`      Generated Title: "${sendData1.data.title}"`);
    console.log(`      AI Model: ${sendData1.data.aiModel}`);
    console.log(`      Reply snippet: "${sendData1.data.reply.slice(0, 120)}..."`);
    console.log(`      Suggested Follow-ups: [${sendData1.data.suggestedFollowUps.map(s => `"${s}"`).join(', ')}]`);

    // 4. Send follow-up query in same conversation
    console.log('\n4️⃣ Sending multi-turn follow-up question in existing conversation...');
    const followUpQuestion = sendData1.data.suggestedFollowUps?.[0] || 'Can you show me a concrete step-by-step example problem?';
    console.log(`   Asking: "${followUpQuestion}"`);

    const sendRes2 = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        conversationId,
        message: followUpQuestion,
      }),
    });

    const sendData2 = await sendRes2.json();
    if (!sendData2.success) throw new Error(`Follow-up chat failed: ${sendData2.message}`);
    console.log(`   ✅ Multi-turn follow-up response received!`);
    console.log(`      Total messages in conversation: ${sendData2.data.messages.length}`);
    if (sendData2.data.messages.length < 4) {
      throw new Error(`Expected at least 4 messages (2 turns), found: ${sendData2.data.messages.length}`);
    }

    // 5. Fetch all conversations for student
    console.log('\n5️⃣ Listing conversations for student...');
    const listRes = await fetch(`${API_BASE}/chat/conversations`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const listData = await listRes.json();
    if (!listData.success) throw new Error(`List conversations failed: ${listData.message}`);
    console.log(`   ✅ Retrieved ${listData.count} conversation(s).`);
    const foundConv = listData.data.find((c) => c._id === conversationId);
    if (!foundConv) throw new Error('Created conversation not found in conversations list');
    console.log(`   ✅ Found active conversation with ${foundConv.messageCount} messages.`);

    // 6. Fetch conversation details by ID
    console.log('\n6️⃣ Fetching full conversation details by ID...');
    const getRes = await fetch(`${API_BASE}/chat/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const getData = await getRes.json();
    if (!getData.success) throw new Error(`Get conversation failed: ${getData.message}`);
    console.log(`   ✅ Conversation details retrieved with subject: ${getData.data.subject?.title || 'None'}`);

    // 7. Update conversation (pin & title)
    console.log('\n7️⃣ Pinning and renaming conversation...');
    const patchRes = await fetch(`${API_BASE}/chat/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Mastering Key Concepts - Pinned Session',
        pinned: true,
      }),
    });
    const patchData = await patchRes.json();
    if (!patchData.success) throw new Error(`Patch conversation failed: ${patchData.message}`);
    console.log(`   ✅ Conversation updated: pinned=${patchData.data.pinned}, title="${patchData.data.title}"`);

    // 8. Delete test conversation to keep clean test state
    console.log('\n8️⃣ Deleting test conversation...');
    const deleteRes = await fetch(`${API_BASE}/chat/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const deleteData = await deleteRes.json();
    if (!deleteData.success) throw new Error(`Delete conversation failed: ${deleteData.message}`);
    console.log('   ✅ Test conversation cleanly deleted.');

    console.log('\n🎉 ALL PHASE 6 BACKEND TESTS PASSED SUCCESSFULLY! 🚀');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Phase 6 Verification Test Failed:', error.message);
    process.exit(1);
  }
}

runPhase6Tests();
