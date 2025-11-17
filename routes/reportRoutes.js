import express from "express";
import {
  createReport,
  getUserReports,
  getReportById,
  updateReportStatus,
  deleteReport,
  updateReport,
  getAllReports
} from "../controllers/reportController.js";

import { protect } from "../middlewares/authMiddleware.js"; 

const router = express.Router();
router.get("/all", getAllReports);

// Citizen routes
router.post("/", createReport);            // Submit a new report
router.get("/user/:id", getUserReports);   // Get all reports by user
router.get("/:id", getReportById);         // Get single report by ID

// Admin routes (basic for now)
router.put("/:id/status", updateReportStatus); // Update status (approve/reject/resolve)
router.delete("/:id", protect, deleteReport);
router.put("/:id", protect, updateReport);


export default router;
