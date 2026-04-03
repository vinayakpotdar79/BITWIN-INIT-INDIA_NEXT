import { google } from "googleapis";
import { oauth2Client } from "../config/googleOAuth.js";
import { getIo } from "../socket/socketServer.js";
import { extractEmailData } from "../utils/emailParser.js";
import { predict } from "./predictService.js";
import { reasonAboutPrediction } from "./agentService.js";
import { sendTelegramAlert } from "./telegramService.js";
import { extractUrls } from "../utils/extractJson.js";
import { captureScreenshot } from "./screenshotService.js";

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
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Fetch latest messages from INBOX and SPAM
    const inboxResponse = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 10,
    });

    const spamResponse = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["SPAM"],
      maxResults: 5, // Fetch fewer from spam to keep initial load fast
    });

    const inboxMessages = (inboxResponse.data.messages || []).slice(0, 3);
    const spamMessages = (spamResponse.data.messages || []).slice(0, 2);
    const messages = [...inboxMessages, ...spamMessages];

    const extractedEmails = [];

    for (const message of messages) {
      // Add a small delay between processing emails to stagger load on Groq API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const emailData = await extractEmailData(gmail, message.id);
      if (emailData) {
        state.processedMessages.add(message.id);

        // Mark as spam if it has the SPAM label
        emailData.isSpam = emailData.labelIds?.includes("SPAM");

        // Enrich with prediction and reasoning
        try {
          const prediction = await predict(emailData.body);

          emailData.prediction = prediction;

          if (prediction?.is_phishing) {
            const reasoning = await reasonAboutPrediction(
              emailData.body,
              prediction,
            );
            console.log(reasoning);

            emailData.reasoning = reasoning;
            await sendTelegramAlert(emailData, prediction, reasoning);
          } else {
            emailData.reasoning = null;
          }
        } catch (enrichError) {
          console.error(
            `Error enriching email ${message.id}:`,
            enrichError.message,
          );
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
    console.error("Error fetching latest emails:", error.message);
    throw error;
  }
}

// ─── pollRecentEmails ─────────────────────────────────────────────────────────

async function pollRecentEmails() {
  if (state.isFetching) return;
  state.isFetching = true;

  try {
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Check for recent ones in INBOX and SPAM
    const inboxResponse = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 5,
    });

    const spamResponse = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["SPAM"],
      maxResults: 5,
    });

    const messages = [
      ...(inboxResponse.data.messages || []).slice(0, 3),
      ...(spamResponse.data.messages || []).slice(0, 2),
    ];

    for (const message of messages) {
      if (!state.processedMessages.has(message.id)) {
        // Add a small delay between processing emails to stagger load on Groq API
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const emailData = await extractEmailData(gmail, message.id);

        if (emailData) {
          // Mark as spam if it has the SPAM label
          emailData.isSpam = emailData.labelIds?.includes("SPAM");

          try {
            const prediction = await predict(emailData.body);

            emailData.prediction = prediction;

            if (prediction?.is_phishing) {
              const reasoning = await reasonAboutPrediction(
                emailData.body,
                prediction,
              );
              // console.log(reasoning);

              emailData.reasoning = reasoning;

              const URLs = extractUrls(emailData.body);

              let screenshotPath = null;
              let screenshotStatus = null;

              if (URLs.length > 0 && URLs[0]?.startsWith("http")) {
                console.log("URL found, capturing screenshot...");

                // screenshotPath = await captureScreenshot(URLs[0], emailData.id);
                const result = await captureScreenshot(URLs[0], emailData.id);

                screenshotStatus = result.status;

                if (result.status === "success") {
                  screenshotPath = result.path;
                }
              }

              await sendTelegramAlert(
                emailData,
                prediction,
                reasoning,
                screenshotPath,
                screenshotStatus,
              );
            } else {
              emailData.reasoning = null;
            }
          } catch (enrichError) {
            console.error(
              `Error enriching polled email ${message.id}:`,
              enrichError.message,
            );
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
            reasoning: emailData.reasoning,
          };

          // console.log(JSON.stringify(logEntry, null, 2));

          // Emit real-time event
          getIo().emit("new-email", emailData);

          // Mark as processed
          state.processedMessages.add(message.id);
        }
      }
    }
  } catch (error) {
    console.error("Error during email polling:", error.message);
  } finally {
    state.isFetching = false;
  }
}

// ─── Watch Controls ───────────────────────────────────────────────────────────

export function startWatch() {
  if (state.pollingInterval) {
    console.log("Polling is already running.");
    return { status: "already_running" };
  }

  console.log("Starting email polling every 20 seconds...");

  // Set interval for 20 seconds
  state.pollingInterval = setInterval(pollRecentEmails, 20 * 1000);

  return { status: "started" };
}

export function stopWatch() {
  if (state.pollingInterval) {
    clearInterval(state.pollingInterval);
    state.pollingInterval = null;
    console.log("Stopped email polling.");
    return { status: "stopped" };
  }
  return { status: "not_running" };
}
