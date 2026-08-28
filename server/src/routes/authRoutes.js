import express from 'express';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  logout,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected Authentication Routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Sample Role-Protected Test Routes to verify RBAC integrity
router.get('/student-only', protect, authorize('student'), (req, res) => {
  res.json({ success: true, message: `Welcome Student ${req.user.name}! Access granted.` });
});

router.get('/teacher-only', protect, authorize('teacher'), (req, res) => {
  res.json({ success: true, message: `Welcome Educator ${req.user.name}! Access granted.` });
});

router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  res.json({ success: true, message: `Welcome Administrator ${req.user.name}! Full system access granted.` });
});

export default router;
