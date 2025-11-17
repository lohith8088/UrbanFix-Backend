// controllers/authController.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import Otp from "../models/Otp.js";
import { sendEmail } from "../services/emailService.js";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 5);
const MAX_OTP_ATTEMPTS = 5;

function generateOtp() {
  return Math.random().toString().slice(2, 2 + OTP_LENGTH).padStart(OTP_LENGTH, "0");
}

function signJwt(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

/* =========================================
   REGISTER FLOW (email + OTP)
   ========================================= */

// STEP 1: REGISTER + SEND OTP
export async function registerSendEmailOtp(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "name, email and password required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const otp = generateOtp();

    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const pwdSalt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, pwdSalt);

    await Otp.deleteMany({ contact: email, purpose: "register" });
    await Otp.create({
      contact: email,
      otpHash,
      expiresAt,
      attempts: 0,
      purpose: "register",
      payload: { name, email, passwordHash }
    });

    await sendEmail(
      email,
      "Your Registration OTP",
      `Your OTP is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`
    );

    return res.json({ ok: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("registerSendEmailOtp error:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
}

// STEP 2: VERIFY OTP + CREATE ACCOUNT
export async function verifyRegisterEmailOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "email and otp required" });

    const otpDoc = await Otp.findOne({ contact: email, purpose: "register" })
      .sort({ _id: -1 });

    if (!otpDoc)
      return res.status(400).json({ message: "No OTP request found for this email" });

    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS)
      return res.status(429).json({ message: "Too many attempts" });

    if (otpDoc.expiresAt < new Date())
      return res.status(400).json({ message: "OTP expired" });

    const ok = await bcrypt.compare(String(otp), otpDoc.otpHash);
    if (!ok) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const payload = otpDoc.payload;

    if (!payload)
      return res.status(500).json({ message: "Registration payload missing" });

    const exists = await User.findOne({ email: payload.email });
    if (exists) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name: payload.name,
      email: payload.email,
      password: payload.passwordHash,
      isEmailVerified: true,
      role: "citizen"
    });

    await Otp.deleteOne({ _id: otpDoc._id });

    const token = signJwt({ id: user._id, role: user.role });

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    console.error("verifyRegisterEmailOtp error:", err);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
}

// STEP 3: RESEND REGISTER OTP
export async function resendRegisterOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email required" });

    const otpDoc = await Otp.findOne({ contact: email, purpose: "register" });
    if (!otpDoc)
      return res.status(400).json({ message: "No pending registration" });

    const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    otpDoc.otpHash = await bcrypt.hash(otp, salt);
    otpDoc.expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    otpDoc.attempts = 0;
    await otpDoc.save();

    await sendEmail(email, "Your OTP (Resent)", `Your OTP is ${otp}.`);

    return res.json({ ok: true, message: "OTP resent" });
  } catch (err) {
    console.error("resendRegisterOtp error:", err);
    return res.status(500).json({ message: "Could not resend OTP" });
  }
}

/* =========================================
   LOGIN
   ========================================= */

export async function loginWithEmail(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid password" });

    const token = signJwt({ id: user._id, role: user.role });

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    console.error("loginWithEmail error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
}

/* =========================================
   FORGOT / RESET PASSWORD (email + OTP)
   ========================================= */

// STEP 1: request reset OTP
export async function forgotPasswordSendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email required" });

    const user = await User.findOne({ email });
    // For security, respond success even if user not found
    if (!user) {
      return res.json({ ok: true, message: "If this email exists, an OTP has been sent." });
    }

    const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await Otp.deleteMany({ contact: email, purpose: "reset" });
    await Otp.create({
      contact: email,
      otpHash,
      expiresAt,
      attempts: 0,
      purpose: "reset",
      payload: { userId: user._id }
    });

    await sendEmail(
      email,
      "Password Reset OTP",
      `Your password reset OTP is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`
    );

    return res.json({ ok: true, message: "If this email exists, an OTP has been sent." });
  } catch (err) {
    console.error("forgotPasswordSendOtp error:", err);
    return res.status(500).json({ message: "Failed to send reset OTP" });
  }
}

// STEP 2: verify OTP + set new password
export async function resetPasswordWithOtp(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "email, otp and newPassword required" });
    }

    const otpDoc = await Otp.findOne({ contact: email, purpose: "reset" }).sort({ _id: -1 });
    if (!otpDoc)
      return res.status(400).json({ message: "No reset OTP found for this email" });

    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS)
      return res.status(429).json({ message: "Too many attempts" });

    if (otpDoc.expiresAt < new Date())
      return res.status(400).json({ message: "OTP expired" });

    const ok = await bcrypt.compare(String(otp), otpDoc.otpHash);
    if (!ok) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    user.password = hash;
    await user.save();

    await Otp.deleteOne({ _id: otpDoc._id });

    return res.json({ ok: true, message: "Password reset successful" });
  } catch (err) {
    console.error("resetPasswordWithOtp error:", err);
    return res.status(500).json({ message: "Failed to reset password" });
  }
}
// Update logged-in user's profile (only name for now)
export async function updateProfile(req, res) {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name.trim();
    await user.save();

    return res.json({
      message: "Profile updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
}
