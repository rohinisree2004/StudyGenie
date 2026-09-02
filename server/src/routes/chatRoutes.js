import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  sendMessage,
  getConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
  clearConversations,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// AI Chat rate limiter: 60 queries per 15 minutes per IP
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'AI Assistant rate limit reached. Please wait a few minutes before asking more questions.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All chat routes require authentication
router.use(protect);

router.post('/message', chatLimiter, sendMessage);
router.get('/conversations', getConversations);
router.delete('/conversations', clearConversations);

router.route('/conversations/:id')
  .get(getConversationById)
  .patch(updateConversation)
  .delete(deleteConversation);

export default router;
