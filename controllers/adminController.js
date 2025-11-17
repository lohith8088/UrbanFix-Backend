import Report from "../models/reportModel.js";
import User from "../models/userModel.js";
import { classifyReport, draftEmail } from "../services/aiService.js";
import { sendEmail } from "../services/emailService.js";
import AuthorityMapping from "../models/authorityMappingModel.js";

// GET /api/admin/reports?status=Approved&category=Pothole&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export const getAllReports = async (req, res) => {
  try {
    const { status, category, startDate, endDate } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const reports = await Report.find(filter)
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/report/:id/approve
// Approve a report, auto-classify with AI, send email to mapped authority
export const approveReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) return res.status(404).json({ message: "Report not found" });

    // update status
    report.status = "Approved";
    report.approvedBy = req.user?.id || req.body.adminId || null;

    // AI classification
    const category = await classifyReport(report.description);
    report.aiClassification = category;
    if (category) report.category = category;

    // find authority mapping
    const mapping = await AuthorityMapping.findOne({ category });

    if (mapping) {
      // draft AI email
      const emailBody = await draftEmail(report);

      // send email to authority
      await sendEmail(
        mapping.authorityEmail,
        `New ${category} Report`,
        emailBody
      );
    }

    await report.save();
    res.json(report);
  } catch (err) {
    console.error("approveReport error:", err);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/report/:id/reject
export const rejectReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.status = "Rejected";
    report.approvedBy = req.user?.id || req.body.adminId || null;

    await report.save();
    res.json(report);
  } catch (err) {
    console.error("rejectReport error:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/mappings
export const createAuthorityMapping = async (req, res) => {
  try {
    const { category, authorityEmail } = req.body;

    if (!category || !authorityEmail) {
      return res.status(400).json({
        message: "category and authorityEmail are required",
      });
    }

    const mapping = await AuthorityMapping.create({ category, authorityEmail });
    res.status(201).json(mapping);
  } catch (err) {
    console.error("createAuthorityMapping error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users?role=admin
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).select("name email role createdAt");
    res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/mappings
export const getAllAuthorityMappings = async (req, res) => {
  try {
    const mappings = await AuthorityMapping.find({});
    res.json(mappings);
  } catch (err) {
    console.error("getAllAuthorityMappings error:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/mappings/:id
export const deleteAuthorityMapping = async (req, res) => {
  try {
    const { id } = req.params;

    const mapping = await AuthorityMapping.findById(id);
    if (!mapping) {
      return res.status(404).json({ message: "Mapping not found" });
    }

    await mapping.deleteOne();
    res.json({ ok: true, message: "Mapping deleted" });
  } catch (err) {
    console.error("deleteAuthorityMapping error:", err);
    res.status(500).json({ message: err.message });
  }
};

