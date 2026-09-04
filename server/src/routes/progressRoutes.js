import express from 'express';
import {
  getStudentProgress,
  getSubjectProgress,
  getPeriodicAnalytics,
  getTeacherStudentsProgress,
  getTeacherSingleStudentProgress,
  getAdminOverview,
} from '../controllers/progressController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All progress routes require authentication
router.use(protect);

// Student & general progress endpoints
router.get('/dashboard', getStudentProgress);
router.get('/subjects/:subjectId', getSubjectProgress);
router.get('/analytics', getPeriodicAnalytics);

// Teacher cohort progress endpoints
router.get('/teacher/students', authorize('teacher', 'admin'), getTeacherStudentsProgress);
router.get('/teacher/students/:studentId', authorize('teacher', 'admin'), getTeacherSingleStudentProgress);

// Admin platform overview
router.get('/admin/overview', authorize('admin'), getAdminOverview);

export default router;
