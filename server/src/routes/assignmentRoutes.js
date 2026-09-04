import express from 'express';
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeAssignmentSubmission,
} from '../controllers/assignmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAssignments)
  .post(authorize('teacher', 'admin'), createAssignment);

router.route('/:id')
  .get(getAssignmentById)
  .put(authorize('teacher', 'admin'), updateAssignment)
  .delete(authorize('teacher', 'admin'), deleteAssignment);

router.post('/:id/submit', authorize('student'), submitAssignment);
router.patch('/:id/grade', authorize('teacher', 'admin'), gradeAssignmentSubmission);

export default router;
