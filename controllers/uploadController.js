import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import fs from "fs";

const upload = multer({ dest: "uploads/" });

export const uploadFiles = [
  upload.array("files", 10), // up to 10 files
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const urls = [];
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "urbanfix/reports",
          resource_type: "auto", // auto-detects image/video
        });

        urls.push(result.secure_url);
        fs.unlinkSync(file.path);
      }

      res.json({ fileURLs: urls });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
];
