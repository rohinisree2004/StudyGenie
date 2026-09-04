import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Material from '../models/Material.js';
import Note from '../models/Note.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studygenie';
    console.log(`[Seed Script] Connecting to database at: ${mongoUri.split('@')[1] || mongoUri}...`);
    await mongoose.connect(mongoUri);

    // =========================================================================
    // 1. Seed Admin
    // =========================================================================
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@studygenie.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@StudyGenie2026!';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      admin.name = adminName;
      admin.role = 'admin';
      admin.accountStatus = 'active';
      admin.password = adminPassword;
      await admin.save();
      console.log(`✅ Admin updated: ${adminEmail}`);
    } else {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        accountStatus: 'active',
        bio: 'Lead System Administrator for StudyGenie platform operations.',
      });
      console.log(`✅ Admin created: ${adminEmail}`);
    }

    // =========================================================================
    // 2. Seed Educator / Teacher
    // =========================================================================
    const teacherEmail = 'sarah.teacher@studygenie.com';
    const teacherPassword = 'TeacherPass123!';
    const teacherName = 'Prof. Sarah Jenkins';

    let teacher = await User.findOne({ email: teacherEmail });
    if (teacher) {
      teacher.name = teacherName;
      teacher.role = 'teacher';
      teacher.accountStatus = 'active';
      teacher.institution = 'Stanford University';
      teacher.bio = 'Associate Professor of Computer Science & Mathematics specializing in Algorithms and Machine Learning.';
      teacher.password = teacherPassword;
      await teacher.save();
      console.log(`✅ Educator updated: ${teacherEmail}`);
    } else {
      teacher = await User.create({
        name: teacherName,
        email: teacherEmail,
        password: teacherPassword,
        role: 'teacher',
        accountStatus: 'active',
        institution: 'Stanford University',
        bio: 'Associate Professor of Computer Science & Mathematics specializing in Algorithms and Machine Learning.',
      });
      console.log(`✅ Educator created: ${teacherEmail}`);
    }

    // =========================================================================
    // 3. Seed Student
    // =========================================================================
    const studentEmail = 'alex.student@studygenie.com';
    const studentPassword = 'StudentPass123!';
    const studentName = 'Alex Morgan';

    let student = await User.findOne({ email: studentEmail });
    if (student) {
      student.name = studentName;
      student.role = 'student';
      student.accountStatus = 'active';
      student.institution = 'Stanford University';
      student.gradeLevel = 'Undergraduate (Year 3)';
      student.bio = 'Computer Science student passionate about distributed systems, algorithms, and AI.';
      student.phone = '+1 (555) 019-2834';
      student.password = studentPassword;
      student.preferences = {
        dailyStudyGoalHours: 5,
        learningStyle: 'visual',
        preferredStudyTime: 'morning',
        reminderFrequency: 'daily',
        emailNotifications: true,
        aiAssistanceLevel: 'standard',
      };
      await student.save();
      console.log(`✅ Student updated: ${studentEmail}`);
    } else {
      student = await User.create({
        name: studentName,
        email: studentEmail,
        password: studentPassword,
        role: 'student',
        accountStatus: 'active',
        institution: 'Stanford University',
        gradeLevel: 'Undergraduate (Year 3)',
        bio: 'Computer Science student passionate about distributed systems, algorithms, and AI.',
        phone: '+1 (555) 019-2834',
        preferences: {
          dailyStudyGoalHours: 5,
          learningStyle: 'visual',
          preferredStudyTime: 'morning',
          reminderFrequency: 'daily',
          emailNotifications: true,
          aiAssistanceLevel: 'standard',
        },
      });
      console.log(`✅ Student created: ${studentEmail}`);
    }

    // =========================================================================
    // 4. Seed Academic Subjects with Soft Pastel styling
    // =========================================================================
    // Subject 1: Data Structures & Algorithms
    let subj1 = await Subject.findOne({ code: 'CS-201' });
    if (!subj1) {
      subj1 = await Subject.create({
        title: 'Data Structures & Algorithms',
        code: 'CS-201',
        description: 'Comprehensive study of algorithmic asymptotic analysis, tree balances, dynamic programming, and graph models.',
        category: 'Computer Science',
        color: '#BBD0FF', // Soft Pastel Sky
        teacher: teacher._id,
        enrolledStudents: [student._id],
        createdBy: admin._id,
        status: 'active',
      });
      console.log(`✅ Subject created: CS-201 (Data Structures & Algorithms)`);
    } else {
      subj1.teacher = teacher._id;
      if (!subj1.enrolledStudents.includes(student._id)) {
        subj1.enrolledStudents.push(student._id);
      }
      await subj1.save();
    }

    // Subject 2: Artificial Intelligence & Neural Systems
    let subj2 = await Subject.findOne({ code: 'CS-320' });
    if (!subj2) {
      subj2 = await Subject.create({
        title: 'Artificial Intelligence & Neural Systems',
        code: 'CS-320',
        description: 'Core principles of state space search, probabilistic reasoning, machine learning algorithms, and deep architectures.',
        category: 'Computer Science',
        color: '#C8B6FF', // Soft Pastel Lavender
        teacher: teacher._id,
        enrolledStudents: [student._id],
        createdBy: admin._id,
        status: 'active',
      });
      console.log(`✅ Subject created: CS-320 (AI & Neural Systems)`);
    } else {
      subj2.teacher = teacher._id;
      if (!subj2.enrolledStudents.includes(student._id)) {
        subj2.enrolledStudents.push(student._id);
      }
      await subj2.save();
    }

    // Subject 3: Linear Algebra for Computing (Available to explore)
    let subj3 = await Subject.findOne({ code: 'MATH-210' });
    if (!subj3) {
      subj3 = await Subject.create({
        title: 'Linear Algebra for Computing',
        code: 'MATH-210',
        description: 'Vector spaces, matrix decomposition, eigenvalues, singular value decomposition, and computational transformations.',
        category: 'Mathematics',
        color: '#E7C6FF', // Soft Pastel Mauve
        teacher: teacher._id,
        enrolledStudents: [],
        createdBy: admin._id,
        status: 'active',
      });
      console.log(`✅ Subject created: MATH-210 (Linear Algebra)`);
    }

    // =========================================================================
    // 5. Seed Topics for CS-201
    // =========================================================================
    const cs201Topics = [
      {
        title: 'Array Operations & Memory Models',
        description: 'Cache locality, contiguous indexing, and amortized resizing analysis.',
        difficulty: 'beginner',
        estimatedHours: 2,
        order: 1,
        completedBy: [student._id], // Alex completed this
      },
      {
        title: 'Linked Lists & Pointer Manipulation',
        description: 'Singly, doubly, and skip list operations with pointer safety.',
        difficulty: 'intermediate',
        estimatedHours: 3,
        order: 2,
        completedBy: [student._id], // Alex completed this
      },
      {
        title: 'Binary Search Trees & AVL Rotations',
        description: 'Maintaining balance invariants, tree traversal, and height bounds.',
        difficulty: 'intermediate',
        estimatedHours: 3,
        order: 3,
        completedBy: [],
      },
      {
        title: 'Graph Traversal (BFS & DFS)',
        description: 'Breadth-first and depth-first searches, topological sorting, and shortest path fundamentals.',
        difficulty: 'advanced',
        estimatedHours: 4,
        order: 4,
        completedBy: [],
      },
      {
        title: 'Dynamic Programming & Memoization',
        description: 'Optimal substructure, overlapping subproblems, and state transition formulation.',
        difficulty: 'advanced',
        estimatedHours: 5,
        order: 5,
        completedBy: [],
      },
    ];

    for (const t of cs201Topics) {
      const exists = await Topic.findOne({ subject: subj1._id, title: t.title });
      if (!exists) {
        await Topic.create({
          ...t,
          subject: subj1._id,
          createdBy: teacher._id,
        });
      }
    }
    console.log(`✅ Seeded ${cs201Topics.length} topics for CS-201`);

    // =========================================================================
    // 6. Seed Topics for CS-320
    // =========================================================================
    const cs320Topics = [
      {
        title: 'Search Algorithms & Heuristics (A*)',
        description: 'Informed state search, admissible heuristics, and branch-and-bound pruning.',
        difficulty: 'beginner',
        estimatedHours: 2,
        order: 1,
        completedBy: [student._id], // Alex completed this
      },
      {
        title: 'Machine Learning Fundamentals & Cost Functions',
        description: 'Supervised regression, classification boundaries, and gradient descent optimization.',
        difficulty: 'intermediate',
        estimatedHours: 3.5,
        order: 2,
        completedBy: [],
      },
      {
        title: 'Deep Neural Networks & Backpropagation',
        description: 'Multilayer perceptrons, chain rule derivatives, activation functions, and regularization.',
        difficulty: 'advanced',
        estimatedHours: 4.5,
        order: 3,
        completedBy: [],
      },
    ];

    for (const t of cs320Topics) {
      const exists = await Topic.findOne({ subject: subj2._id, title: t.title });
      if (!exists) {
        await Topic.create({
          ...t,
          subject: subj2._id,
          createdBy: teacher._id,
        });
      }
    }
    console.log(`✅ Seeded ${cs320Topics.length} topics for CS-320`);

    // =========================================================================
    // 6. Seed Study Materials
    // =========================================================================
    const uploadsDir = path.resolve(__dirname, '../../uploads/materials');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const mat1File = 'CS201_Algorithm_Complexity_Guide.pdf';
    fs.writeFileSync(
      path.join(uploadsDir, mat1File),
      '%PDF-1.4 ... StudyGenie Course Material: Asymptotic Notations and Big-O Reference Guide.'
    );

    const mat2File = 'CS201_Binary_Trees_Deep_Dive.pdf';
    fs.writeFileSync(
      path.join(uploadsDir, mat2File),
      '%PDF-1.4 ... StudyGenie Course Material: Binary Search Trees, Rotations, and AVL balancing.'
    );

    const mat3File = 'MATH210_Eigenvalues_Eigenvectors.pdf';
    fs.writeFileSync(
      path.join(uploadsDir, mat3File),
      '%PDF-1.4 ... StudyGenie Course Material: Linear Transformations & Diagonalization theorems.'
    );

    const topicCS1 = await Topic.findOne({ subject: subj1._id });
    const topicMath1 = await Topic.findOne({ subject: subj3._id });

    let m1 = await Material.findOne({ title: 'Asymptotic Analysis & Big-O Notation Guide' });
    if (!m1) {
      m1 = await Material.create({
        title: 'Asymptotic Analysis & Big-O Notation Guide',
        description: 'Comprehensive cheat sheet covering Big-O, Big-Omega, Big-Theta bounds and recurrence relations with Master Theorem examples.',
        fileUrl: `/uploads/materials/${mat1File}`,
        fileName: mat1File,
        fileType: 'pdf',
        fileSize: 1048576, // 1 MB
        subject: subj1._id,
        topic: topicCS1 ? topicCS1._id : null,
        uploadedBy: teacher._id,
        tags: ['algorithms', 'big-o', 'complexity', 'cheat-sheet'],
        isPublic: true,
        downloadCount: 14,
      });
    }

    let m2 = await Material.findOne({ title: 'Binary Search Trees & Self-Balancing Trees' });
    if (!m2) {
      m2 = await Material.create({
        title: 'Binary Search Trees & Self-Balancing Trees',
        description: 'Illustrated lecture slides covering standard binary tree traversals, AVL rotational mechanics, and red-black tree insertion invariants.',
        fileUrl: `/uploads/materials/${mat2File}`,
        fileName: mat2File,
        fileType: 'pdf',
        fileSize: 2450000,
        subject: subj1._id,
        topic: topicCS1 ? topicCS1._id : null,
        uploadedBy: teacher._id,
        tags: ['trees', 'avl', 'rotations', 'data-structures'],
        isPublic: true,
        downloadCount: 28,
      });
    }

    let m3 = await Material.findOne({ title: 'Eigenvalues & Characteristic Polynomials' });
    if (!m3) {
      m3 = await Material.create({
        title: 'Eigenvalues & Characteristic Polynomials',
        description: 'Complete derivation of characteristic equations, determinant properties, algebraic vs geometric multiplicity with applied ML examples.',
        fileUrl: `/uploads/materials/${mat3File}`,
        fileName: mat3File,
        fileType: 'pdf',
        fileSize: 1780000,
        subject: subj3._id,
        topic: topicMath1 ? topicMath1._id : null,
        uploadedBy: teacher._id,
        tags: ['linear-algebra', 'matrices', 'eigenvalues', 'calculus'],
        isPublic: true,
        downloadCount: 9,
      });
    }
    console.log('✅ Seeded sample Study Materials');

    // =========================================================================
    // 7. Seed Student Personal Notes
    // =========================================================================
    const note1 = await Note.findOne({ user: student._id, title: 'Master Theorem Shortcut Notes' });
    if (!note1) {
      await Note.create({
        title: 'Master Theorem Shortcut Notes',
        content: `### Master Theorem Quick Reference

The Master Method solves recurrence relations of the form:
$$T(n) = a T(n/b) + f(n)$$
where $a \\ge 1$, $b > 1$.

- **Case 1**: If $f(n) = O(n^{\\log_b a - \\epsilon})$, then $T(n) = \\Theta(n^{\\log_b a})$
- **Case 2**: If $f(n) = \\Theta(n^{\\log_b a})$, then $T(n) = \\Theta(n^{\\log_b a} \\log n)$
- **Case 3**: If $f(n) = \\Omega(n^{\\log_b a + \\epsilon})$, then $T(n) = \\Theta(f(n))$

*Reminder: Check regularity condition for Case 3!*`,
        user: student._id,
        subject: subj1._id,
        topic: topicCS1 ? topicCS1._id : null,
        material: m1._id,
        tags: ['algorithms', 'master-theorem', 'recurrence', 'exam-prep'],
        color: '#FFD6FF', // Soft Pastel Pink
        isPinned: true,
      });
    }

    const note2 = await Note.findOne({ user: student._id, title: 'AVL Tree Rotation Invariants' });
    if (!note2) {
      await Note.create({
        title: 'AVL Tree Rotation Invariants',
        content: `### AVL Balance Factors & Rotations

- **Balance Factor**: $BF(node) = height(left) - height(right)$
- Acceptable values: $\\{-1, 0, +1\\}$

**When $BF = +2$ or $-2$, rebalance:**
1. **Left-Left (LL)**: Single Right Rotation
2. **Right-Right (RR)**: Single Left Rotation
3. **Left-Right (LR)**: Left Rotate left child, then Right Rotate node
4. **Right-Left (RL)**: Right Rotate right child, then Left Rotate node`,
        user: student._id,
        subject: subj1._id,
        topic: topicCS1 ? topicCS1._id : null,
        material: m2._id,
        tags: ['avl', 'trees', 'balancing'],
        color: '#E7C6FF', // Soft Pastel Mauve
        isPinned: true,
      });
    }

    const note3 = await Note.findOne({ user: student._id, title: 'Matrix Diagonalization Checklist' });
    if (!note3) {
      await Note.create({
        title: 'Matrix Diagonalization Checklist',
        content: `### Steps to Diagonalize Matrix A ($A = P D P^{-1}$)

1. Find eigenvalues by computing roots of $\\det(A - \\lambda I) = 0$.
2. For each $\\lambda_i$, find basis vectors for nullspace $(A - \\lambda_i I)v = 0$.
3. Check: Are there $n$ linearly independent eigenvectors?
   - If yes: matrix is diagonalizable!
   - If geometric multiplicity < algebraic multiplicity: defective matrix, cannot diagonalize.
4. Construct matrix $P$ with eigenvectors as columns, and diagonal matrix $D$ with corresponding eigenvalues.`,
        user: student._id,
        subject: subj3._id,
        topic: topicMath1 ? topicMath1._id : null,
        material: m3._id,
        tags: ['linear-algebra', 'matrices', 'diagonalization'],
        color: '#BBD0FF', // Soft Pastel Sky
        isPinned: false,
      });
    }
    console.log('✅ Seeded sample Student Notes');

    console.log(`\n======================================================`);
    console.log(`🎉 StudyGenie Seed Data Provisioned Successfully!`);
    console.log(`------------------------------------------------------`);
    console.log(`👑 ADMIN:`);
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     admin`);
    console.log(`------------------------------------------------------`);
    console.log(`👩‍🏫 EDUCATOR / TEACHER:`);
    console.log(`   Name:     ${teacherName}`);
    console.log(`   Email:    ${teacherEmail}`);
    console.log(`   Password: ${teacherPassword}`);
    console.log(`   Role:     teacher`);
    console.log(`------------------------------------------------------`);
    console.log(`👨‍🎓 STUDENT:`);
    console.log(`   Name:     ${studentName}`);
    console.log(`   Email:    ${studentEmail}`);
    console.log(`   Password: ${studentPassword}`);
    console.log(`   Role:     student`);
    console.log(`======================================================\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Script Error]:`, error);
    process.exit(1);
  }
};

seedData();
