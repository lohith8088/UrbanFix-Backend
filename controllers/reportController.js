import Report from "../models/reportModel.js";
import { getCoordinatesFromAddress } from "../services/geocodingService.js";

/**
 * Create new report (Citizen)
 * Frontend sends:
 * {
 *   title, description, category, address,
 *   photoURLs: [string], videoURLs: [string],
 *   createdBy: userId
 * }
 * Backend will geocode the address into GeoJSON location automatically.
 */
export const createReport = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      address,
      photoURLs,
      videoURLs,
      createdBy
    } = req.body;

    // 1) Geocode address to coordinates using our service
    let location = null;
    if (address) {
      try {
        const coords = await getCoordinatesFromAddress(address);
        if (coords && coords.latitude && coords.longitude) {
          location = {
            type: "Point",
            coordinates: [coords.longitude, coords.latitude] // [lng, lat]
          };
        }
      } catch (geoErr) {
        console.warn("Geocoding failed for address:", address, geoErr.message);
      }
    }

    const report = await Report.create({
      title,
      description,
      category,
      address,
      photoURLs: photoURLs || [],
      videoURLs: videoURLs || [],
      location,
      createdBy
    });

    res.status(201).json(report);
  } catch (error) {
    console.error("createReport error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all reports created by a specific user
 * GET /api/report/user/:id
 */
export const getUserReports = async (req, res) => {
  try {
    const reports = await Report.find({ createdBy: req.params.id });
    res.json(reports);
  } catch (error) {
    console.error("getUserReports error:", error);
    res.status(500).json({ message: error.message });
  }
};


// Get all reports (for maps / public view)
export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find({});
    res.json(reports);
  } catch (error) {
    console.error("getAllReports error:", error);
    res.status(500).json({ message: error.message });
  }
};


/**
 * Get single report by ID
 * GET /api/report/:id
 */
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!report) return res.status(404).json({ message: "Report not found" });

    res.json(report);
  } catch (error) {
    console.error("getReportById error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin: Update report status (approve/reject/resolve/ongoing)
 * PUT /api/report/:id/status
 * Body: { status, adminId }
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { status, adminId } = req.body;
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = status;

    // Optionally track who did what
    if (status === "Approved") {
      report.approvedBy = adminId;
    }

    if (status === "Resolved") {
      report.resolvedBy = adminId;
      report.resolvedAt = new Date();
    }

    if (status === "Rejected") {
      // You could add report.rejectedBy = adminId if you want later
    }

    await report.save();
    res.json(report);
  } catch (error) {
    console.error("updateReportStatus error:", error);
    res.status(500).json({ message: error.message });
  }
};
/**
 * Delete report (owner or admin)
 * DELETE /api/report/:id
 * 
 * 
 */




// Citizen can edit only pending reports
export const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (report.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending reports can be edited" });
    }

    if (String(report.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const editableFields = ["title", "description", "category", "address"];
    editableFields.forEach((f) => {
      if (req.body[f] !== undefined) report[f] = req.body[f];
    });

    await report.save();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name;
    await user.save();

    res.json({
      message: "Profile updated",
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const user = req.user; // filled by authMiddleware

    const isOwner = user && String(report.createdBy) === String(user._id);
    const isAdmin =
      user && (user.role === "admin" || user.role === "superadmin");

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this report" });
    }

    await report.deleteOne();
    res.json({ ok: true, message: "Report deleted" });
  } catch (error) {
    console.error("deleteReport error:", error);
    res.status(500).json({ message: error.message });
  }
};
