import express from "express";
import {
   getAllReports,
  approveReport,
  rejectReport,
  createAuthorityMapping,
  getAllUsers,
  getAllAuthorityMappings,
  deleteAuthorityMapping
} from "../controllers/adminController.js";



import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes here require admin or superadmin
router.use(protect, authorize("admin", "superadmin"));

// Fetch all reports (with optional filters)
router.get("/reports", getAllReports);

// Approve a report
router.put("/report/:id/approve", approveReport);

// Reject a report
router.put("/report/:id/reject", rejectReport);

// Create authority mapping (category → authority email)
router.post("/mappings", createAuthorityMapping);

// Fetch all users
router.get("/users", getAllUsers);
router.get("/mappings", getAllAuthorityMappings); // <-- ADD THIS
router.delete("/mappings/:id", deleteAuthorityMapping);

export default router;
