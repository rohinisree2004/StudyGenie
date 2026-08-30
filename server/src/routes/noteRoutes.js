import express from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  togglePinNote,
  deleteNote,
} from '../controllers/noteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All note routes require valid authentication and are scoped to req.user
router.use(protect);

router
  .route('/')
  .get(getNotes)
  .post(createNote);

router.patch('/:id/pin', togglePinNote);

router
  .route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

export default router;
