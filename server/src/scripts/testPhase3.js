import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Phase 3 Automated Verification Tests...\n');

  try {
    // 1. Authenticate Teacher
    console.log('1️⃣ Logging in as Educator (Sarah Teacher)...');
    const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
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
    console.log('   ✅ Teacher authenticated successfully.');

    // 2. Fetch Subjects for Teacher
    console.log('2️⃣ Fetching Educator classes/subjects...');
    const subjectsRes = await fetch(`${BASE_URL}/subjects`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const subjectsData = await subjectsRes.json();
    const subjectsList = subjectsData.subjects || subjectsData.data || [];
    if (!subjectsData.success || subjectsList.length === 0) {
      throw new Error('No subjects found for test.');
    }
    const testSubject = subjectsList[0];
    const subjectId = testSubject.id || testSubject._id;
    console.log(`   ✅ Using Subject: "${testSubject.title}" (${subjectId})`);

    // Fetch topics for this subject
    const topicsRes = await fetch(`${BASE_URL}/subjects/${subjectId}/topics`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const topicsData = await topicsRes.json();
    const topicsList = topicsData.topics || topicsData.data || [];
    const testTopic = topicsList.length > 0 ? topicsList[0] : null;
    const topicId = testTopic ? (testTopic.id || testTopic._id) : null;
    if (testTopic) {
      console.log(`   ✅ Using Topic: "${testTopic.title}" (${topicId})`);
    }

    // 3. Create dummy file and upload material as Teacher
    console.log('3️⃣ Teacher uploading Study Material...');
    const dummyFilePath = path.join(__dirname, 'temp_test_guide.pdf');
    fs.writeFileSync(dummyFilePath, '%PDF-1.4 ... Simulated StudyGenie Lecture Notes for Phase 3 testing');

    const formData = new FormData();
    const fileBuffer = fs.readFileSync(dummyFilePath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'Data_Structures_Lecture_1.pdf');
    formData.append('title', 'Lecture 1: Trees and Graphs Cheat Sheet');
    formData.append('description', 'Comprehensive lecture summary for algorithms and complex traversal.');
    formData.append('subject', subjectId);
    if (topicId) formData.append('topic', topicId);
    formData.append('tags', 'trees, graphs, algorithms, cheat-sheet');
    formData.append('isPublic', 'true');

    const uploadRes = await fetch(`${BASE_URL}/materials`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    fs.unlinkSync(dummyFilePath); // Clean up temp file

    if (!uploadData.success) {
      throw new Error(`Material upload failed: ${uploadData.message}`);
    }
    const createdMaterial = uploadData.data;
    console.log(`   ✅ Material created: "${createdMaterial.title}"`);
    console.log(`      File URL: ${createdMaterial.fileUrl}, Type: ${createdMaterial.fileType}, Size: ${createdMaterial.fileSize} bytes`);

    // 4. Authenticate Student
    console.log('4️⃣ Logging in as Student (Alex Student)...');
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
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

    // 5. Student searches and lists materials
    console.log('5️⃣ Student querying study materials...');
    const studentMaterialsRes = await fetch(`${BASE_URL}/materials?subject=${subjectId}&search=Graphs`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentMaterials = await studentMaterialsRes.json();
    if (!studentMaterials.success || studentMaterials.data.length === 0) {
      throw new Error('Student query did not return the newly uploaded material.');
    }
    console.log(`   ✅ Student retrieved ${studentMaterials.count} matching material(s).`);

    // 6. Student views material details
    console.log('6️⃣ Student fetching material details by ID...');
    const detailRes = await fetch(`${BASE_URL}/materials/${createdMaterial._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const detailData = await detailRes.json();
    if (!detailData.success || detailData.data.title !== createdMaterial.title) {
      throw new Error('Failed to retrieve material details.');
    }
    console.log(`   ✅ Material details verified. Uploader: ${detailData.data.uploadedBy.name}`);

    // 7. Student downloads material
    console.log('7️⃣ Student downloading material file...');
    const downloadRes = await fetch(`${BASE_URL}/materials/${createdMaterial._id}/download`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (!downloadRes.ok) {
      throw new Error(`Download endpoint returned HTTP ${downloadRes.status}`);
    }
    const downloadBlob = await downloadRes.arrayBuffer();
    console.log(`   ✅ Download stream verified (${downloadBlob.byteLength} bytes).`);

    // 8. Security verification: Student attempts to upload material
    console.log('8️⃣ Verifying RBAC: Student attempts to upload material...');
    const unauthUploadRes = await fetch(`${BASE_URL}/materials`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: new FormData(),
    });
    if (unauthUploadRes.status === 403) {
      console.log('   ✅ RBAC enforced: Student blocked with 403 Forbidden.');
    } else {
      throw new Error(`Expected 403 Forbidden for student upload, got ${unauthUploadRes.status}`);
    }

    // 9. Student creates a personal Study Note
    console.log('9️⃣ Student creating a personal study note...');
    const noteRes = await fetch(`${BASE_URL}/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Binary Tree Traversal Methods',
        content: '# Tree Traversals\n\n- **In-Order**: Left, Root, Right\n- **Pre-Order**: Root, Left, Right\n- **Post-Order**: Left, Right, Root\n\n*Key takeaway: In-order traversal on a BST yields sorted order!*',
        subject: subjectId,
        topic: topicId,
        material: createdMaterial._id,
        tags: ['binary-tree', 'dsa', 'revision'],
        color: '#FFD6FF', // Soft Pastel Pink
        isPinned: false,
      }),
    });
    const noteData = await noteRes.json();
    if (!noteData.success) throw new Error(`Note creation failed: ${noteData.message}`);
    const createdNote = noteData.data;
    console.log(`   ✅ Note created: "${createdNote.title}" with color ${createdNote.color}`);

    // 10. Student toggles pin on the note
    console.log('🔟 Student pinning note...');
    const pinRes = await fetch(`${BASE_URL}/notes/${createdNote._id}/pin`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const pinData = await pinRes.json();
    if (!pinData.success || !pinData.data.isPinned) {
      throw new Error('Failed to pin note.');
    }
    console.log('   ✅ Note successfully pinned to top 📌');

    // 11. Student lists their notes
    console.log('1️⃣1️⃣ Student listing notes...');
    const listNotesRes = await fetch(`${BASE_URL}/notes?subject=${subjectId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const listNotes = await listNotesRes.json();
    if (!listNotes.success || listNotes.data.length === 0) {
      throw new Error('Failed to list student notes.');
    }
    console.log(`   ✅ Found ${listNotes.count} personal notes.`);

    // 12. Privacy check: Teacher attempts to view student's note
    console.log("1️⃣2️⃣ Verifying Note Privacy: Teacher attempts to fetch student's note...");
    const teacherNoteRes = await fetch(`${BASE_URL}/notes/${createdNote._id}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    if (teacherNoteRes.status === 404) {
      console.log("   ✅ Strict Privacy enforced: Student's note is invisible to teacher (404).");
    } else {
      throw new Error(`Expected 404 for teacher accessing student note, got ${teacherNoteRes.status}`);
    }

    // 13. Student updates note
    console.log('1️⃣3️⃣ Student updating note content...');
    const updateNoteRes = await fetch(`${BASE_URL}/notes/${createdNote._id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Binary Tree Traversal Methods (Updated)',
        color: '#C8B6FF', // Soft Pastel Lavender
      }),
    });
    const updateNoteData = await updateNoteRes.json();
    if (!updateNoteData.success || updateNoteData.data.title !== 'Binary Tree Traversal Methods (Updated)') {
      throw new Error('Note update failed.');
    }
    console.log('   ✅ Note updated successfully.');

    // 14. Student deletes note
    console.log('1️⃣4️⃣ Student deleting test note...');
    const deleteNoteRes = await fetch(`${BASE_URL}/notes/${createdNote._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const deleteNoteData = await deleteNoteRes.json();
    if (!deleteNoteData.success) throw new Error('Note deletion failed.');
    console.log('   ✅ Note deleted successfully.');

    // 15. Teacher deletes test material
    console.log('1️⃣5️⃣ Teacher deleting test material...');
    const deleteMatRes = await fetch(`${BASE_URL}/materials/${createdMaterial._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const deleteMatData = await deleteMatRes.json();
    if (!deleteMatData.success) throw new Error('Material deletion failed.');
    console.log('   ✅ Study material and disk file removed cleanly.');

    console.log('\n🎉 ALL PHASE 3 BACKEND API TESTS PASSED WITH 100% SUCCESS! 🚀\n');
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    process.exit(1);
  }
}

runTests();
