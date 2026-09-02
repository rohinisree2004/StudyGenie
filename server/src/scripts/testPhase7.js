import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runPhase7Tests() {
  console.log('🧪 Starting Phase 7 – AI Content Processing & Summarization Verification Tests...\n');

  try {
    // 1. Authenticate Student
    console.log('1️⃣ Authenticating Student (Alex Morgan)...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.student@studygenie.com',
        password: 'StudentPass123!',
      }),
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(`Student login failed: ${loginData.message}`);
    const token = loginData.token;
    console.log('   ✅ Student authenticated successfully.');

    // 2. Fetch or create a test note
    console.log('2️⃣ Preparing student test note for summarization...');
    const noteRes = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Phase 7 Linear Transformations and Kernel Spaces',
        content: `A linear transformation T from vector space V to W is a mapping that preserves vector addition and scalar multiplication. 
Formally, T(u + v) = T(u) + T(v) and T(c u) = c T(u) for any vectors u, v in V and scalar c in F.
The kernel (or null space) of T is the set of all vectors in V that map to the zero vector in W: Ker(T) = {v in V | T(v) = 0}.
The image (or range) of T is the set of all vectors in W of the form T(v): Im(T) = {T(v) | v in V}.
The Dimension Theorem (Rank-Nullity Theorem) states that dim(V) = nullity(T) + rank(T).
If nullity(T) = 0, then T is injective (one-to-one). If rank(T) = dim(W), then T is surjective (onto).
When T is both injective and surjective, it is an isomorphism, meaning V and W have identical algebraic structures.`,
        color: '#E7C6FF',
      }),
    });
    const noteData = await noteRes.json();
    if (!noteData.success) throw new Error(`Create test note failed: ${noteData.message}`);
    const testNoteId = noteData.data._id;
    console.log(`   ✅ Test Note created: "${noteData.data.title}" (ID: ${testNoteId})`);

    // 3. Generate Summary from Personal Note
    console.log('\n3️⃣ Generating structured AI summary from Student Note via Gemini engine...');
    const generateNoteSummaryRes = await fetch(`${API_BASE}/summaries/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sourceType: 'note',
        noteId: testNoteId,
        focusMode: 'balanced',
      }),
    });
    const summaryResult = await generateNoteSummaryRes.json();
    if (!summaryResult.success) throw new Error(`Note summarization failed: ${summaryResult.message}`);

    const summary = summaryResult.data;
    console.log(`   ✅ AI Summary Generated! (Model: ${summary.aiModel})`);
    console.log(`      Short Summary: "${summary.shortSummary.slice(0, 100)}..."`);
    console.log(`      Detailed Summary length: ${summary.detailedSummary.length} chars`);
    console.log(`      Key Points count: ${summary.keyPoints.length}`);
    console.log(`      Important Terms count: ${summary.importantTerms.length}`);
    console.log(`      Revision Notes count: ${summary.revisionNotes.length}`);

    // Validate 5 required elements
    if (!summary.shortSummary || !summary.detailedSummary) {
      throw new Error('Summary missing short or detailed summary');
    }
    if (!Array.isArray(summary.keyPoints) || summary.keyPoints.length < 2) {
      throw new Error('Key points missing or insufficient items');
    }
    if (!Array.isArray(summary.importantTerms) || summary.importantTerms.length < 2) {
      throw new Error('Important terms missing or insufficient items');
    }
    if (!Array.isArray(summary.revisionNotes) || summary.revisionNotes.length < 2) {
      throw new Error('Revision notes missing or insufficient items');
    }
    console.log('   ✅ All 5 required structural elements successfully validated.');

    // 4. Test summarizing Course Study Material if available
    console.log('\n4️⃣ Testing Material Summarization endpoint...');
    const materialsRes = await fetch(`${API_BASE}/materials`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const materialsData = await materialsRes.json();
    const materialList = materialsData.materials || materialsData.data || [];

    if (materialList.length > 0) {
      const targetMaterial = materialList[0];
      console.log(`   Testing with material: "${targetMaterial.title}" (ID: ${targetMaterial._id})`);
      const materialSummaryRes = await fetch(`${API_BASE}/summaries/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceType: 'material',
          materialId: targetMaterial._id,
          focusMode: 'exam',
        }),
      });
      const matSummaryResult = await materialSummaryRes.json();
      if (!matSummaryResult.success) throw new Error(`Material summarization failed: ${matSummaryResult.message}`);
      console.log(`   ✅ Material summary generated successfully!`);
    } else {
      console.log('   ℹ️ No materials found in database, tested note workflow.');
    }

    // 5. Save Summary to Library
    console.log('\n5️⃣ Saving generated summary into student library...');
    const saveRes = await fetch(`${API_BASE}/summaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: summary.title,
        sourceType: 'note',
        noteId: testNoteId,
        shortSummary: summary.shortSummary,
        detailedSummary: summary.detailedSummary,
        keyPoints: summary.keyPoints,
        importantTerms: summary.importantTerms,
        revisionNotes: summary.revisionNotes,
        focusMode: 'balanced',
        aiModel: summary.aiModel,
      }),
    });
    const saveData = await saveRes.json();
    if (!saveData.success) throw new Error(`Save summary failed: ${saveData.message}`);
    const savedSummaryId = saveData.data._id;
    console.log(`   ✅ Summary saved to library with ID: ${savedSummaryId}`);

    // 6. List user saved summaries
    console.log('\n6️⃣ Listing saved summaries...');
    const listRes = await fetch(`${API_BASE}/summaries`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = await listRes.json();
    if (!listData.success) throw new Error(`List summaries failed: ${listData.message}`);
    console.log(`   ✅ Retrieved ${listData.count} saved summaries.`);
    const foundSummary = listData.data.find((s) => s._id === savedSummaryId);
    if (!foundSummary) throw new Error('Saved summary was not found in library list');

    // 7. Get summary by ID
    console.log('\n7️⃣ Fetching summary details by ID...');
    const getRes = await fetch(`${API_BASE}/summaries/${savedSummaryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getData = await getRes.json();
    if (!getData.success) throw new Error(`Get summary failed: ${getData.message}`);
    console.log(`   ✅ Summary retrieved: "${getData.data.title}"`);

    // 8. Export Summary to Note
    console.log('\n8️⃣ Exporting summary to a new Note...');
    const exportRes = await fetch(`${API_BASE}/summaries/${savedSummaryId}/export-to-note`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const exportData = await exportRes.json();
    if (!exportData.success) throw new Error(`Export to note failed: ${exportData.message}`);
    const exportedNoteId = exportData.data.noteId;
    console.log(`   ✅ Summary successfully exported to new Note (ID: ${exportedNoteId})`);

    // 9. Clean up test summary and test notes
    console.log('\n9️⃣ Cleaning up test data...');
    await fetch(`${API_BASE}/summaries/${savedSummaryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetch(`${API_BASE}/notes/${testNoteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetch(`${API_BASE}/notes/${exportedNoteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('   ✅ All test artifacts cleanly deleted.');

    console.log('\n🎉 ALL PHASE 7 BACKEND TESTS PASSED SUCCESSFULLY! 🚀');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Phase 7 Verification Test Failed:', error.message);
    process.exit(1);
  }
}

runPhase7Tests();
