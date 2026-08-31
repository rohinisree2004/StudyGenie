import express from 'express';
import {
  getStudySessions,
  getStudySessionById,
  createStudySession,
  updateStudySession,
  completeStudySession,
  deleteStudySession,
} from '../controllers/studySessionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getStudySessions)
  .post(createStudySession);

router.route('/:id')
  .get(getStudySessionById)
  .put(updateStudySession)
  .delete(deleteStudySession);

router.patch('/:id/complete', completeStudySession);

export default router;
