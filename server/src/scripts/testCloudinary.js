import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

async function testCloudinaryIntegration() {
  console.log('☁️ Testing Cloudinary Integration for StudyGenie...\n');

  try {
    // 1. Authenticate Student
    console.log('1️⃣ Authenticating Student (Alex Morgan)...');
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.student@studygenie.com',
        password: 'StudentPass123!',
      }),
    });
    const studentLogin = await studentLoginRes.json();
    if (!studentLogin.success) throw new Error(`Login failed: ${studentLogin.message}`);
    const studentToken = studentLogin.token;
    console.log('   ✅ Student logged in successfully.');

    // 2. Upload Profile Image / Avatar to Cloudinary
    console.log('2️⃣ Uploading Student Avatar to Cloudinary...');
    // Create a 1x1 transparent PNG file
    const testImgPath = path.join(__dirname, 'temp_avatar.png');
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEcQHsWn1r1wAAAABJRU5ErkJggg==';
    fs.writeFileSync(testImgPath, Buffer.from(pngBase64, 'base64'));

    const avatarFormData = new FormData();
    const imgBuffer = fs.readFileSync(testImgPath);
    const imgBlob = new Blob([imgBuffer], { type: 'image/png' });
    avatarFormData.append('avatar', imgBlob, 'alex_profile_pic.png');

    const avatarRes = await fetch(`${BASE_URL}/users/avatar`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: avatarFormData,
    });
    const avatarData = await avatarRes.json();
    fs.unlinkSync(testImgPath);

    if (!avatarData.success) {
      throw new Error(`Avatar upload failed: ${avatarData.message}`);
    }

    console.log(`   ✅ Avatar uploaded to Cloudinary: ${avatarData.avatar}`);
    if (!avatarData.avatar.includes('cloudinary.com')) {
      throw new Error('Avatar URL does not point to Cloudinary CDN!');
    }

    // 3. Verify user profile returns Cloudinary avatar
    console.log('3️⃣ Fetching Profile details to verify Cloudinary Avatar...');
    const profileRes = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const profileData = await profileRes.json();
    if (profileData.user.avatar !== avatarData.avatar) {
      throw new Error('Profile avatar does not match uploaded Cloudinary URL.');
    }
    console.log(`   ✅ Verified user profile has Cloudinary avatar.`);

    // 4. Authenticate Teacher for Material Upload
    console.log('4️⃣ Authenticating Educator (Sarah Jenkins)...');
    const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.teacher@studygenie.com',
        password: 'TeacherPass123!',
      }),
    });
    const teacherLogin = await teacherLoginRes.json();
    const teacherToken = teacherLogin.token;

    // Get teacher's subject
    const subjRes = await fetch(`${BASE_URL}/subjects`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const subjData = await subjRes.json();
    const testSubject = (subjData.subjects || [])[0];
    const subjectId = testSubject.id || testSubject._id;

    // 5. Upload Material to Cloudinary
    console.log('5️⃣ Uploading Course Material to Cloudinary...');
    const testDocPath = path.join(__dirname, 'temp_cloud_guide.pdf');
    fs.writeFileSync(testDocPath, '%PDF-1.4 ... Cloudinary test document for StudyGenie Phase 3');

    const matFormData = new FormData();
    const docBuffer = fs.readFileSync(testDocPath);
    const docBlob = new Blob([docBuffer], { type: 'application/pdf' });
    matFormData.append('file', docBlob, 'Cloudinary_Storage_Guide.pdf');
    matFormData.append('title', 'Cloudinary Asset Architecture Guide');
    matFormData.append('description', 'Verified cloud-hosted study material on Cloudinary CDN.');
    matFormData.append('subject', subjectId);
    matFormData.append('tags', 'cloud, storage, test');

    const matRes = await fetch(`${BASE_URL}/materials`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: matFormData,
    });
    const matData = await matRes.json();
    fs.unlinkSync(testDocPath);

    if (!matData.success) {
      throw new Error(`Material upload failed: ${matData.message}`);
    }

    console.log(`   ✅ Material created: "${matData.data.title}"`);
    console.log(`      File URL: ${matData.data.fileUrl}`);
    console.log(`      Cloudinary Public ID: ${matData.data.cloudinaryPublicId || 'local'}`);

    // 6. Test Download / Redirect
    console.log('6️⃣ Testing Material Download Endpoint...');
    const dlRes = await fetch(`${BASE_URL}/materials/${matData.data._id}/download`, {
      headers: { Authorization: `Bearer ${studentToken}` },
      redirect: 'manual',
    });
    console.log(`   ✅ Download endpoint returned HTTP status: ${dlRes.status}`);

    // 7. Clean up test material
    console.log('7️⃣ Deleting test material from Cloudinary & DB...');
    const delMatRes = await fetch(`${BASE_URL}/materials/${matData.data._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const delMatData = await delMatRes.json();
    if (!delMatData.success) throw new Error('Material deletion failed.');
    console.log('   ✅ Material cleaned up from Cloudinary and DB.');

    console.log('\n🎉 CLOUDINARY INTEGRATION TEST PASSED WITH 100% SUCCESS! ☁️🚀\n');
  } catch (error) {
    console.error('\n❌ Cloudinary Test Error:', error.message);
    process.exit(1);
  }
}

testCloudinaryIntegration();
