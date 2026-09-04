import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearReadNotifications,
  checkUpcomingReminders,
} from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/mark-all-read', markAllNotificationsRead);
router.delete('/clear-read', clearReadNotifications);
router.post('/check-reminders', checkUpcomingReminders);

router.patch('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;
