// middleware/otpRateLimit.js
import rateLimit from 'express-rate-limit';

export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests, please try later.' }
});
