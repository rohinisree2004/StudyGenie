import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getAllStudents,
  getAllTeachers,
  assignTeacherToSubject,
  getAllMaterials,
  updateMaterialVisibility,
  deleteMaterial,
  getAllQuizzes,
  deleteQuiz,
  getSystemHealth,
  broadcastNotification,
} from '../controllers/adminController.js';

const router = express.Router();

// Strict RBAC: All administrative routes require authenticated Admin clearance
router.use(protect);
router.use(authorize('admin'));

// Platform Overview & KPIs
router.get('/dashboard-stats', getDashboardStats);
router.get('/system-health', getSystemHealth);
router.post('/broadcast', broadcastNotification);

// User Management (All Users)
router.route('/users')
  .get(getAllUsers)
  .post(createUser);

router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.patch('/users/:id/status', updateUserStatus);

// Specialized Student & Teacher Directories
router.get('/students', getAllStudents);
router.get('/teachers', getAllTeachers);

// Subject / Curriculum Admin Operations
router.patch('/subjects/:id/assign-teacher', assignTeacherToSubject);

// Material Management & Moderation
router.route('/materials')
  .get(getAllMaterials);

router.patch('/materials/:id/visibility', updateMaterialVisibility);
router.delete('/materials/:id', deleteMaterial);

// Quiz Management & Moderation
router.route('/quizzes')
  .get(getAllQuizzes);

router.delete('/quizzes/:id', deleteQuiz);

export default router;
