import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export async function captureScreenshot(url, emailId) {
  const filePath = path.join("screenshots", `${emailId}.png`);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    await page.screenshot({ path: filePath, fullPage: true });

    // return filePath;
    return { path: filePath, status: "success" };
  } catch (err) {
    console.error("Screenshot failed:", err.message);

    if (err.message.includes("ERR_NAME_NOT_RESOLVED")) {
      return { path: null, status: "invalid_domain" };
    }

    return { path: null, status: "failed" };
  } finally {
    await browser.close();
  }
}
