import express from "express";
import { kavachMitraAgent } from "../services/agentService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { message } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res
      .status(400)
      .json({ error: "Request body must include { message: string }" });
  }

  try {
    const botData = await kavachMitraAgent(message);

    if (botData.error) {
      return res
        .status(500)
        .json({
          error: botData.error,
          note: botData.note || "Groq agent error",
        });
    }

    return res.json(botData);
  } catch (error) {
    console.error("Error in /chatbot-ui:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", (req, res) => {
  res.json({ status: "chatbot-ui ready" });
});

export default router;
