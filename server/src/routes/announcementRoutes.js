import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePinAnnouncement,
} from '../controllers/announcementController.js';

const router = express.Router();

router.use(protect);

router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);

// Educator / Admin authoring routes
router.post('/', authorize('teacher', 'admin'), createAnnouncement);
router.put('/:id', authorize('teacher', 'admin'), updateAnnouncement);
router.delete('/:id', authorize('teacher', 'admin'), deleteAnnouncement);
router.patch('/:id/pin', authorize('teacher', 'admin'), togglePinAnnouncement);

export default router;
