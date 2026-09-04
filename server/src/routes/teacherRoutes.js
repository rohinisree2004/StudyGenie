import express from 'express';
import {
  getTeacherDashboardStats,
  getTeacherStudentsList,
  getTeacherStudentDetail,
  getSubjectStudents,
} from '../controllers/teacherController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All teacher monitoring routes require authentication and teacher or admin role
router.use(protect);
router.use(authorize('teacher', 'admin'));

// Teacher dashboard overview KPIs & alerts
router.get('/dashboard-stats', getTeacherDashboardStats);

// Teacher student monitoring list with search, filters, and sort
router.get('/students', getTeacherStudentsList);

// Detailed student performance deep-dive in teacher's subjects
router.get('/students/:studentId', getTeacherStudentDetail);

// Subject-specific class roster & performance
router.get('/subjects/:subjectId/students', getSubjectStudents);

export default router;
