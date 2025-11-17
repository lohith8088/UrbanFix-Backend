import express from "express";
import { getCoordinatesFromAddress } from "../services/geocodingService.js";

const router = express.Router();

// Test geocoding: send address, get lat/lng
router.post("/geocode", async (req, res) => {
  const { address } = req.body;
  try {
    const coords = await getCoordinatesFromAddress(address);
    if (coords) {
      res.json({ address, ...coords });
    } else {
      res.status(404).json({ message: "No coordinates found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
