import express from "express";
import { predictURL } from "../services/predictService.js";

const router = express.Router();

// router.post("/url", async (req, res) => {
//   try {
//     const { url } = req.body;
//     if (!url) {
//       return res.status(400).json({ error: "URL is required" });
//     }

//     // Get prediction
//     const prediction = await predict(url);

//     // Get reasoning
//     let reasoning = null;
//     try {
//       reasoning = await reasonAboutPrediction(url, prediction);
//     } catch (reasonError) {
//       console.error("Error getting reasoning for URL:", reasonError.message);
//     }

//     res.json({
//       prediction,
//       reasoning,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("Error fetching URL:", error);
//     res.status(500).json({ error: "Failed to fetch URL" });
//   }
// });
router.post("/url", async (req, res) => {
  const { url } = req.body;

  // 1. Validation
  if (!url) {
    return res.status(400).json({
      success: false,
      error: "URL is required in the request body.",
    });
  }

  try {
    // 2. Get AI Prediction from Hugging Face
    // Ensure predictURL sends { url: url } as we discussed
    const prediction = await predictURL(url);
    console.log("URL prediction:", prediction);

    // 4. Successful Response
    return res.status(200).json({
      success: true,
      data: {
        url,
        prediction,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in URL detection route:", error);

    // 5. Categorized Error Response
    const statusCode = error.message.includes("Prediction API error")
      ? 502
      : 500;
    return res.status(statusCode).json({
      success: false,
      error: "Failed to analyze the URL. Please try again later.",
    });
  }
});

export default router;
