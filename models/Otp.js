// models/Otp.js
import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  contact: { type: String, index: true }, // email for OTP
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  purpose: { type: String, default: 'auth' },
  payload: { type: mongoose.Schema.Types.Mixed }
});

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model('Otp', OtpSchema);
export default Otp;
