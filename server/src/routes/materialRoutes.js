import express from 'express';
import {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  downloadMaterial,
} from '../controllers/materialController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// All material routes require valid authentication
router.use(protect);

router
  .route('/')
  .get(getMaterials)
  .post(authorize('teacher', 'admin'), upload.single('file'), createMaterial);

router.route('/:id/download').get(downloadMaterial);

router
  .route('/:id')
  .get(getMaterialById)
  .put(authorize('teacher', 'admin'), upload.single('file'), updateMaterial)
  .delete(authorize('teacher', 'admin'), deleteMaterial);

export default router;
