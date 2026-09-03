import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  generateSummary,
  saveSummary,
  getSummaries,
  getSummaryById,
  deleteSummary,
  exportSummaryToNote,
} from '../controllers/summaryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Summarizer rate limiter: 45 requests per 15 minutes
const summaryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 45,
  message: {
    success: false,
    message: 'AI Summarizer rate limit reached. Please wait a few minutes before processing more documents.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes require authentication
router.use(protect);

router.post('/generate', summaryLimiter, generateSummary);
router.post('/', saveSummary);
router.get('/', getSummaries);

router.route('/:id')
  .get(getSummaryById)
  .delete(deleteSummary);

router.post('/:id/export-to-note', exportSummaryToNote);

export default router;
