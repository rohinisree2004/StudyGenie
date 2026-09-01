import express from 'express';
import {
  generatePlan,
  getStudyPlans,
  getStudyPlanById,
  updateStudyPlan,
  applyPlanToCalendar,
  togglePlanSessionComplete,
  regeneratePlan,
  deleteStudyPlan,
} from '../controllers/studyPlanController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All study plan routes require authentication
router.use(protect);

router.post('/generate', authorize('student', 'admin'), generatePlan);
router.get('/', authorize('student', 'admin'), getStudyPlans);

router.route('/:id')
  .get(getStudyPlanById)
  .put(authorize('student', 'admin'), updateStudyPlan)
  .delete(authorize('student', 'admin'), deleteStudyPlan);

router.post('/:id/apply-to-calendar', authorize('student', 'admin'), applyPlanToCalendar);
router.patch('/:id/sessions/:sessionId/toggle', authorize('student', 'admin'), togglePlanSessionComplete);
router.post('/:id/regenerate', authorize('student', 'admin'), regeneratePlan);

export default router;
