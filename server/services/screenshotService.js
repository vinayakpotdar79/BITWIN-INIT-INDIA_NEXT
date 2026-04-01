import puppeteer from "puppeteer";

/**
 * KavachX — Safe Headless Screenshot Capture
 *
 * KEY CHANGE: We now screenshot EVEN if the page fails to load.
 * A "net::ERR_TUNNEL_CONNECTION_FAILED" or blocked page is itself
 * evidence — we capture whatever the browser renders (error page included).
 *
 * @param {string} url - The suspicious URL to screenshot
 * @returns {Promise<{ success: boolean, screenshot: string|null, title: string|null, error?: string }>}
 */
export async function captureScreenshot(url) {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-plugins",
        "--no-first-run",
        "--incognito",
        "--disable-client-side-phishing-detection",
        "--disable-features=BlockInsecurePrivateNetworkRequests",
        "--allow-running-insecure-content",
        // ── KEY FIX: Disable the tunnel proxy that causes ERR_TUNNEL_CONNECTION_FAILED
        "--no-proxy-server",
        // ── KEY FIX: Disable the built-in ad/tracker blocker that causes ERR_BLOCKED_BY_CLIENT
        "--disable-features=AdTagging,TrustTokens",
      ],
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Block only heavy media — allow everything else so error pages render fully
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (req.resourceType() === "media") {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // ── KEY FIX: Use domcontentloaded instead of networkidle2 ─────────────────
    // networkidle2 THROWS if the page doesn't fully load (dead domains etc.)
    // domcontentloaded succeeds as soon as ANY content renders — including error pages.
    // We wrap in try/catch so even a navigation failure still gives us a screenshot.
    let navigationError = null;
    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
    } catch (navError) {
      // ── KEY FIX: Don't give up here! ─────────────────────────────────────
      // The page may have partially loaded or shown a browser error page.
      // We record the error but continue to take the screenshot anyway.
      navigationError = navError.message;
      console.warn(`[SCREENSHOT] Navigation error (still screenshotting): ${navError.message}`);
    }

    // Wait a tiny bit for any content to paint (even error pages need ~500ms)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Grab whatever title is available (may be empty on error pages)
    let title = "";
    try {
      title = await page.title();
    } catch {
      title = "Unknown (page failed to load)";
    }

    // ── SCREENSHOT regardless of navigation success ───────────────────────────
    const screenshotBuffer = await page.screenshot({
      type: "jpeg",
      quality: 80,
      fullPage: false, // Just the visible viewport
    });

    const screenshot = screenshotBuffer.toString("base64");

    return {
      success: true,
      screenshot,
      title,
      url,
      // Pass the nav error along so the frontend can show "site was unreachable"
      navigationError: navigationError || null,
    };

  } catch (error) {
    // This only fires if Puppeteer itself crashes (very rare)
    console.error("[SCREENSHOT] Fatal Puppeteer error:", error.message);

    return {
      success: false,
      screenshot: null,
      title: null,
      url,
      error: error.message,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}