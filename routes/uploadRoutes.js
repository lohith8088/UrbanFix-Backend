import express from "express";
import { uploadFiles } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/", uploadFiles);

export default router;
