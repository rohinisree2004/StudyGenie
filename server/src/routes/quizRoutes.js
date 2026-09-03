import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  generateQuiz,
  getQuizzes,
  getQuizById,
  submitQuizAttempt,
  getAttemptById,
  getUserAttempts,
  updateQuiz,
  deleteQuiz,
} from '../controllers/quizController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Quiz generation rate limiter: 40 requests per 15 minutes
const quizGenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: {
    success: false,
    message: 'Quiz generation limit reached. Please wait a few minutes before generating more quizzes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All quiz routes require authentication
router.use(protect);

router.post('/generate', quizGenLimiter, generateQuiz);
router.get('/', getQuizzes);
router.get('/attempts', getUserAttempts);
router.get('/attempts/:id', getAttemptById);

router.route('/:id')
  .get(getQuizById)
  .patch(updateQuiz)
  .delete(deleteQuiz);

router.post('/:id/attempt', submitQuizAttempt);

export default router;
