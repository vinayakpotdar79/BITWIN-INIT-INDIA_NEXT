import express from "express";
import multer from "multer";
import { predictAudio } from "../services/predictService.js";

const router = express.Router();
const upload = multer(); // Store file in memory

router.post("/audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // Pass the buffer and filename to the service
    const prediction = await predictAudio(
      req.file.buffer,
      req.file.originalname,
    );

    res.json({
      success: true,
      data: {
        prediction,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
