import express from 'express';
import {
  updateTopic,
  deleteTopic,
  toggleTopicCompletion,
} from '../controllers/topicController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All topic operations require authentication

router
  .route('/:id')
  .put(authorize('admin', 'teacher'), updateTopic)
  .delete(authorize('admin', 'teacher'), deleteTopic);

// Student topic completion tracking
router.post('/:id/toggle-completion', authorize('student'), toggleTopicCompletion);

export default router;
