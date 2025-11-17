import express from "express";
import { sendEmail } from "../services/emailService.js";

const router = express.Router();

// Test email route
router.post("/email", async (req, res) => {
  const { to, subject, body } = req.body;
  try {
    await sendEmail(to, subject, body);
    res.json({ message: "✅ Email sent!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
