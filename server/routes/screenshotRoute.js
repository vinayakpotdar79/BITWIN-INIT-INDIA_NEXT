import express from 'express';
import { captureScreenshot } from '../services/screenshotService.js';
import { predict } from '../services/predictService.js';

const router = express.Router();

/**
 * POST /screenshot
 * Body: { url: string }
 *
 * Only captures a screenshot if the URL is predicted as phishing/malicious.
 * Returns: { screenshot (base64), title, prediction, isThreat }
 */
router.post('/screenshot', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Basic URL validation
  try {
    new URL(url); // This throws if the URL is invalid
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    // Step 1: Run the URL through your existing prediction model first
    let prediction = null;
    try {
      prediction = await predict(url);
    } catch (predError) {
      console.error('Prediction failed, proceeding to screenshot anyway:', predError.message);
    }

    // Step 2: Capture the screenshot safely
    console.log(`[SCREENSHOT] Capturing: ${url}`);
    const result = await captureScreenshot(url);

    // Step 3: Return everything to the frontend
    res.json({
      url,
      prediction,
      screenshot: result.screenshot,   // base64 string, ready for <img src="data:image/jpeg;base64,...">
      pageTitle: result.pageTitle,
      success: result.success,
      error: result.error || null,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in /screenshot route:', error.message);
    res.status(500).json({ error: 'Failed to process screenshot request', details: error.message });
  }
});

export default router;