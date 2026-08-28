import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  updateUserPreferences,
  getTeachersList,
  uploadUserAvatar,
  removeUserAvatar,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect); // All user profile & preference routes require authentication

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.put('/preferences', updateUserPreferences);
router.get('/teachers', getTeachersList);

// Avatar management
router.put('/avatar', upload.single('avatar'), uploadUserAvatar);
router.delete('/avatar', removeUserAvatar);

export default router;
