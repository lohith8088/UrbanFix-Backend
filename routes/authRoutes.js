// routes/authRoutes.js
import express from 'express';
const router = express.Router();

import {
  registerSendEmailOtp,
  verifyRegisterEmailOtp,
  resendRegisterOtp,
  loginWithEmail,
  forgotPasswordSendOtp,
  resetPasswordWithOtp, 
  updateProfile
} from '../controllers/authController.js';

import { otpRateLimiter } from '../middlewares/otpRateLimit.js';
import { protect } from '../middlewares/authMiddleware.js';


// Registration + login
router.post('/register', otpRateLimiter, registerSendEmailOtp);
router.post('/verify-email-otp', verifyRegisterEmailOtp);
router.post('/resend-register-otp', otpRateLimiter, resendRegisterOtp);
router.post('/login', loginWithEmail);

router.put("/profile", protect, updateProfile);
// Forgot / reset password
router.post('/forgot-password', otpRateLimiter, forgotPasswordSendOtp);
router.post('/reset-password', resetPasswordWithOtp);
// Update profile (name)
router.put('/profile', protect, updateProfile);

export default router;
