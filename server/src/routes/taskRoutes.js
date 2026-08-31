import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskComplete,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All task routes require authentication
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/toggle', toggleTaskComplete);

export default router;
