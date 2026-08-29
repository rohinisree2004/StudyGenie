import express from 'express';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  enrollSubject,
  unenrollSubject,
  assignTeacher,
} from '../controllers/subjectController.js';
import {
  getTopicsBySubject,
  createTopic,
} from '../controllers/topicController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All subject operations require authentication

// Subject collections & CRUD
router
  .route('/')
  .get(getSubjects)
  .post(authorize('admin', 'teacher'), createSubject);

router
  .route('/:id')
  .get(getSubjectById)
  .put(authorize('admin', 'teacher'), updateSubject)
  .delete(authorize('admin'), deleteSubject);

// Enrollment endpoints (Students)
router.post('/:id/enroll', authorize('student'), enrollSubject);
router.post('/:id/unenroll', authorize('student'), unenrollSubject);

// Teacher assignment (Admin only)
router.put('/:id/assign-teacher', authorize('admin'), assignTeacher);

// Nested Topic endpoints under subject
router
  .route('/:subjectId/topics')
  .get(getTopicsBySubject)
  .post(authorize('admin', 'teacher'), createTopic);

export default router;
