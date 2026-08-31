import express from 'express';
import { getCalendarEvents } from '../controllers/calendarController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/events', getCalendarEvents);

export default router;
