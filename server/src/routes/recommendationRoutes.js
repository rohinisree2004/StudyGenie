import express from 'express';
import {
  getStudentRecommendations,
  regenerateRecommendations,
  getRecommendationById,
} from '../controllers/recommendationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All recommendation routes require authentication
router.use(protect);

// Get recommendations (cached if < 24h old unless ?force=true)
router.get('/', getStudentRecommendations);

// Explicitly regenerate fresh AI recommendations
router.post('/generate', regenerateRecommendations);

// Get recommendation by ID
router.get('/:id', getRecommendationById);

export default router;
