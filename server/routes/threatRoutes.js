import express from "express";
import { analyzeThreat } from "../services/threatService.js";

const router = express.Router();

router.post("/threatAgent", async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length < 5) {
    return res.status(400).json({
      success: false,
      error: "Threat description must be at least 5 characters",
    });
  }

  try {
    const result = await analyzeThreat(text);

    return res.status(200).json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        model: "groq-llama3",
      },
    });
  } catch (error) {
    console.error("Threat route error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Failed to analyze threat",
    });
  }
});

export default router;
