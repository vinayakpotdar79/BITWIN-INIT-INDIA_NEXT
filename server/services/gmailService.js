import { google } from 'googleapis';
import { oauth2Client } from '../config/googleOAuth.js';
import { getIo } from '../socket/socketServer.js';
import { extractEmailData } from '../utils/emailParser.js';
import { predict } from './predictService.js';
import { reasonAboutPrediction } from './agentService.js';
import { captureScreenshot } from './screenshotService.js';
import fs from 'fs';
import path from 'path';

// ─── Screenshot Storage Setup ─────────────────────────────────────────────────
const SCREENSHOTS_DIR = path.resolve('./screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  console.log(`[SCREENSHOT] Storage folder created at: ${SCREENSHOTS_DIR}`);
}

/**
 * Extracts all URLs from a block of text (email body).
 */
function extractUrls(text) {
  if (!text) return [];
  const urlRegex = /https?:\/\/[^\s"'<>)\]]+/g;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches.map(u => u.replace(/[.,;!?]+$/, '')))];
}

/**
 * Saves a base64 JPEG to disk under screenshots/<messageId>/url_N.jpg
 */
function saveScreenshot(base64String, messageId, index, url) {
  try {
    const emailDir = path.join(SCREENSHOTS_DIR, messageId);
    if (!fs.existsSync(emailDir)) {
      fs.mkdirSync(emailDir, { recursive: true });
    }

    const filename = `url_${index + 1}.jpg`;
    const filePath = path.join(emailDir, filename);

    const buffer = Buffer.from(base64String, 'base64');
    fs.writeFileSync(filePath, buffer);

    console.log(`[SCREENSHOT] ✅ Saved: ${filePath}  (from URL: ${url})`);
    return filePath;
  } catch (err) {
    console.error(`[SCREENSHOT] ❌ Failed to save screenshot for ${url}:`, err.message);
    return null;
  }
}

/**
 * Returns true for well-known safe domains that never need screenshotting.
 */
function isSafeUrl(url) {
  const safeDomains = [
    'google.com', 'gmail.com', 'googleapis.com',
    'youtube.com', 'facebook.com', 'twitter.com',
    'linkedin.com', 'instagram.com', 'github.com',
    'microsoft.com', 'apple.com', 'amazon.com',
    'mailchimp.com', 'sendgrid.net', 'mandrillapp.com',
    'fonts.googleapis.com', 'w3.org',             // ← added: these are technical/safe
  ];

  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return safeDomains.some(safe => hostname === safe || hostname.endsWith('.' + safe));
  } catch {
    return true; // malformed URL → skip
  }
}

/**
 * ── KEY FIX ───────────────────────────────────────────────────────────────────
 * Determines if a URL should be screenshotted.
 *
 * YOUR PREDICTION API returns:
 *   { prediction: "legitimate", confidence: 1, is_phishing: false, note: "Text too short for analysis" }
 *
 * The OLD code only checked `is_phishing === true` — which was always false
 * because your model can't really analyse a bare URL (text too short).
 *
 * NEW APPROACH: For bare URLs (not full email bodies), we use HEURISTICS
 * to decide whether to screenshot. The model result is used as a HINT only.
 *
 * We screenshot a URL if ANY of the following are true:
 *   1. The model explicitly says it's phishing/malicious
 *   2. The domain looks suspicious (typosquatting patterns)
 *   3. The URL uses a non-standard TLD (.innn, .xyz, .tk, etc.)
 *   4. The model note says "text too short" (meaning it couldn't analyse it —
 *      in that case we screenshot anyway to be safe)
 * ─────────────────────────────────────────────────────────────────────────────
 */
function checkIfThreat(prediction, url) {
  if (!prediction) return true; // No prediction = screenshot to be safe

  console.log('🔍 checkIfThreat received:', JSON.stringify(prediction));

  // ── Part A: Trust the model if it explicitly flags it ─────────────────────
  const modelSaysPhishing = (
    prediction.label === 'phishing' ||
    prediction.label === 'malicious' ||
    prediction.label === 'spam' ||
    prediction.prediction === 1 ||
    prediction.prediction === '1' ||
    prediction.result === 'phishing' ||
    prediction.is_phishing === true ||
    prediction.class === 1 ||
    (prediction.confidence && prediction.confidence > 0.7 && prediction.label !== 'safe')
  );

  if (modelSaysPhishing) return true;

  // ── Part B: Model said "text too short" → it couldn't analyse the URL ─────
  // In this case, fall back to heuristics instead of blindly trusting "legitimate"
  const modelCouldntAnalyse = (
    prediction.note === 'Text too short for analysis' ||
    prediction.prediction === 'legitimate' // model defaulted to safe without real analysis
  );

  if (modelCouldntAnalyse && url) {
    return isSuspiciousUrl(url); // use heuristics as fallback
  }

  return false; // model said safe and could actually analyse it
}

/**
 * Heuristic checks for suspicious URLs when the model can't analyse them.
 * Catches typosquatting and fake domains that phishers commonly use.
 */
function isSuspiciousUrl(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    // ── Suspicious TLDs (commonly used in phishing) ────────────────────────
    const suspiciousTlds = [
      '.tk', '.ml', '.ga', '.cf', '.gq',     // free domains
      '.xyz', '.top', '.club', '.online',     // cheap domains
      '.info', '.biz',                        // often abused
      '.innn', '.inn',                        // clear typosquats
    ];
    if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
      console.log(`[THREAT] Suspicious TLD detected: ${hostname}`);
      return true;
    }

    // ── Typosquatting: looks like a bank/brand but isn't ──────────────────
    const brandKeywords = ['bank', 'secure', 'login', 'verify', 'account', 'paypal', 'wallet'];
    const knownSafeDomains = ['axis.bank', 'hdfcbank.com', 'sbi.co.in', 'icicibank.com'];

    const looksLikeBrand = brandKeywords.some(kw => hostname.includes(kw));
    const isActuallyKnownSafe = knownSafeDomains.some(d => hostname === d || hostname.endsWith('.' + d));

    if (looksLikeBrand && !isActuallyKnownSafe) {
      console.log(`[THREAT] Brand keyword in suspicious domain: ${hostname}`);
      return true;
    }

    // ── IP address URLs (phishers use raw IPs to avoid domain blacklists) ─
    const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipPattern.test(hostname)) {
      console.log(`[THREAT] Raw IP address URL: ${hostname}`);
      return true;
    }

    // ── Excessively long subdomains (e.g. secure-login.axisbank.phish.com) ─
    const parts = hostname.split('.');
    if (parts.length > 4) {
      console.log(`[THREAT] Too many subdomains: ${hostname}`);
      return true;
    }

    return false; // Looks normal
  } catch {
    return true; // Can't parse = screenshot to be safe
  }
}

/**
 * Main function: finds URLs in an email, checks each one,
 * and screenshots any that look suspicious.
 */
async function screenshotUrlsInEmail(emailBody, messageId) {
  const urls = extractUrls(emailBody);

  if (urls.length === 0) {
    console.log(`[SCREENSHOT] No URLs found in email ${messageId}`);
    return [];
  }

  const limitedUrls = urls.slice(0, 5);
  console.log(`[SCREENSHOT] Checking ${limitedUrls.length} URL(s) in email ${messageId}`);

  const results = [];

  for (let i = 0; i < limitedUrls.length; i++) {
    const url = limitedUrls[i];

    // Step 1: Skip well-known safe domains
    if (isSafeUrl(url)) {
      console.log(`[SCREENSHOT] ⏭ Skipping safe URL: ${url}`);
      continue;
    }

    // Step 2: Run prediction (but don't skip if it fails — use heuristics)
    let prediction = null;
    try {
      prediction = await predict(url);
      console.log('🔍 RAW PREDICTION for', url, ':', JSON.stringify(prediction));
    } catch (err) {
      console.warn(`[SCREENSHOT] Prediction failed for ${url}, using heuristics only`);
      // Don't skip — fall through with prediction=null, checkIfThreat handles it
    }

    // Step 3: Decide whether to screenshot (model + heuristics combined)
    const isThreat = checkIfThreat(prediction, url);

    if (!isThreat) {
      console.log(`[SCREENSHOT] ✅ URL is safe, skipping screenshot: ${url}`);
      results.push({ url, filePath: null, success: false, pageTitle: null, threat: false });
      continue;
    }

    // Step 4: Screenshot the URL (even if the page is an error page)
    console.log(`[SCREENSHOT] 🚨 Threat detected! Capturing: ${url}`);
    const result = await captureScreenshot(url);

    let filePath = null;
    if (result.success && result.screenshot) {
      filePath = saveScreenshot(result.screenshot, messageId, i, url);
    }

    results.push({
      url,
      filePath,
      success: result.success,
      pageTitle: result.title,
      threat: true,
      navigationError: result.navigationError || null,
      error: result.error || null,
    });
  }

  return results;
}

// ─── Gmail State ──────────────────────────────────────────────────────────────

class GmailServiceState {
  constructor() {
    this.processedMessages = new Set();
    this.pollingInterval = null;
    this.isFetching = false;
  }
}

const state = new GmailServiceState();

// ─── getLatestEmails ──────────────────────────────────────────────────────────

export async function getLatestEmails() {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const inboxResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 10,
    });

    const spamResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['SPAM'],
      maxResults: 5,
    });

    const inboxMessages = (inboxResponse.data.messages || []).slice(0, 3);
    const spamMessages = (spamResponse.data.messages || []).slice(0, 2);
    const messages = [...inboxMessages, ...spamMessages];

    const extractedEmails = [];

    for (const message of messages) {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const emailData = await extractEmailData(gmail, message.id);
      if (emailData) {
        state.processedMessages.add(message.id);
        emailData.isSpam = emailData.labelIds?.includes('SPAM');

        try {
          const prediction = await predict(emailData.body);
          const reasoning = await reasonAboutPrediction(emailData.body, prediction);
          emailData.prediction = prediction;
          emailData.reasoning = reasoning;
        } catch (enrichError) {
          console.error(`Error enriching email ${message.id}:`, enrichError.message);
          emailData.prediction = null;
          emailData.reasoning = null;
        }

        try {
          const screenshotResults = await screenshotUrlsInEmail(emailData.body, message.id);
          emailData.screenshots = screenshotResults;
        } catch (ssError) {
          console.error(`[SCREENSHOT] Error during URL screenshots for ${message.id}:`, ssError.message);
          emailData.screenshots = [];
        }

        extractedEmails.push(emailData);
      }
    }

    return extractedEmails;
  } catch (error) {
    console.error('Error fetching latest emails:', error.message);
    throw error;
  }
}

// ─── pollRecentEmails ─────────────────────────────────────────────────────────

async function pollRecentEmails() {
  if (state.isFetching) return;
  state.isFetching = true;

  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const inboxResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 5,
    });

    const spamResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['SPAM'],
      maxResults: 5,
    });

    const messages = [
      ...(inboxResponse.data.messages || []).slice(0, 3),
      ...(spamResponse.data.messages || []).slice(0, 2),
    ];

    for (const message of messages) {
      if (!state.processedMessages.has(message.id)) {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const emailData = await extractEmailData(gmail, message.id);

        if (emailData) {
          emailData.isSpam = emailData.labelIds?.includes('SPAM');

          try {
            const prediction = await predict(emailData.body);
            const reasoning = await reasonAboutPrediction(emailData.body, prediction);
            emailData.prediction = prediction;
            emailData.reasoning = reasoning;
          } catch (enrichError) {
            console.error(`Error enriching polled email ${message.id}:`, enrichError.message);
            emailData.prediction = null;
            emailData.reasoning = null;
          }

          try {
            const screenshotResults = await screenshotUrlsInEmail(emailData.body, message.id);
            emailData.screenshots = screenshotResults;
          } catch (ssError) {
            console.error(`[SCREENSHOT] Error during URL screenshots for ${message.id}:`, ssError.message);
            emailData.screenshots = [];
          }

          const logEntry = {
            subject: emailData.subject,
            from: emailData.from,
            timestamp: emailData.timestamp,
            prediction: emailData.prediction,
            screenshots: emailData.screenshots?.map(s => ({
              url: s.url,
              filePath: s.filePath,
              success: s.success,
              threat: s.threat,
            })),
          };

          console.log(JSON.stringify(logEntry, null, 2));

          getIo().emit('new-email', emailData);
          state.processedMessages.add(message.id);
        }
      }
    }
  } catch (error) {
    console.error('Error during email polling:', error.message);
  } finally {
    state.isFetching = false;
  }
}

// ─── Watch Controls ───────────────────────────────────────────────────────────

export function startWatch() {
  if (state.pollingInterval) {
    console.log('Polling is already running.');
    return { status: 'already_running' };
  }

  console.log('Starting email polling every 20 seconds...');
  state.pollingInterval = setInterval(pollRecentEmails, 20 * 1000);
  return { status: 'started' };
}

export function stopWatch() {
  if (state.pollingInterval) {
    clearInterval(state.pollingInterval);
    state.pollingInterval = null;
    console.log('Stopped email polling.');
    return { status: 'stopped' };
  }
  return { status: 'not_running' };
}