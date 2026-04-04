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

const CF_TOKEN = process.env.CLOUDFLARE_TOKEN;
 
// ── Cloudflare Radar proxy ────────────────────────────────────────────────────
// Frontend calls: GET http://localhost:2000/threat/radar/top-attacked
// This proxies to Cloudflare server-side (avoids CORS)
 
router.get("/radar/top-attacked", async (req, res) => {
  try {
    if (!CF_TOKEN) {
      console.warn("⚠️  CLOUDFLARE_TOKEN not set in .env — returning 503");
      return res.status(503).json({
        error: "CLOUDFLARE_TOKEN not configured on server",
      });
    }
 
    const params = new URLSearchParams({
      dateRange: "7d",
      limit: "15",
      format: "json",
    });
 
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/radar/attacks/layer3/top/locations/origin?${params}`,
      {
        headers: {
          Authorization: `Bearer ${CF_TOKEN}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      }
    );
 
    if (!cfRes.ok) {
      const errText = await cfRes.text();
      console.error("Cloudflare API error:", cfRes.status, errText);
      return res.status(cfRes.status).json({ error: errText });
    }
 
    const data = await cfRes.json();
    console.log("✅ Cloudflare Radar data fetched successfully");
    return res.json(data);
 
  } catch (err) {
    console.error("Radar proxy error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
