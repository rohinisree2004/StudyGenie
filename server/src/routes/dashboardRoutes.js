import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getStudentDashboard,
  getTeacherDashboard,
  getAdminDashboard,
} from '../controllers/dashboardController.js';

const router = express.Router();

// Strict RBAC: All dashboard analytics routes require valid authentication
router.use(protect);

// Role-specific Consolidated Dashboard Endpoints
router.get('/student', authorize('student'), getStudentDashboard);
router.get('/teacher', authorize('teacher', 'admin'), getTeacherDashboard);
router.get('/admin', authorize('admin'), getAdminDashboard);

export default router;
