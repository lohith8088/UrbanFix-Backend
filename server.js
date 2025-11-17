import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import testEmailRoutes from "./routes/testEmailRoutes.js";
import testGeoRoutes from "./routes/testGeoRoutes.js";
import { protect as requireAuth } from './middlewares/authMiddleware.js';

// Load environment variables first
dotenv.config();

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: 'https://urban-fix-frontend-phi.vercel.app/', // Your Vite frontend URL
  credentials: true
}));

app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use('/api/users', userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/test", testEmailRoutes);
app.use("/api/test-map", testGeoRoutes);
app.get('/api/user/me', requireAuth, (req, res) => {
  if (!req.user) return res.status(404).json({ message: 'User not found' });

  const user = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  };

  res.json(user);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
