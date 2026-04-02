import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { getAuthUrl, getTokens, setCredentials, oauth2Client } from '../config/googleOAuth.js';
import { getLatestEmails, setupGmailWatch, stopGmailWatch, handleGmailNotification, processNewEmail } from '../services/gmailService.js';
import { getWebhookUrl, disconnectNgrok } from '../utils/ngrokUtils.js';
import { saveTokens, loadTokens, clearTokens } from '../utils/tokenStorage.js';
import { predict } from '../services/predictService.js';
import { reasonAboutPrediction } from '../services/agentService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Load tokens from persistent storage on startup
let userTokens = loadTokens();

// Frontend URL for redirecting after OAuth (set in .env as FRONTEND_URL)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

router.get('/auth/google', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing.' });
    }

    const tokens = await getTokens(code);
    userTokens = tokens; // Store in memory
    saveTokens(tokens); // Save to persistent storage

    console.log('✅ OAuth tokens saved persistently');

    // Redirect to frontend with success indicator
    res.redirect(`${FRONTEND_URL}/?auth=success`);
  } catch (error) {
    console.error('Error during OAuth callback:', error.message);
    res.status(500).json({ error: 'Failed to complete OAuth flow.' });
  }
});

router.get('/auth/status', (req, res) => {
  res.json({ authenticated: Boolean(userTokens) });
});

router.post('/auth/logout', async (req, res) => {
  try {
    userTokens = null;
    clearTokens(); // Clear from persistent storage
    await stopGmailWatch();

    // Disconnect ngrok tunnel in development
    if (process.env.NODE_ENV !== 'production') {
      await disconnectNgrok();
    }

    res.json({ loggedOut: true });
  } catch (error) {
    console.error('Error during logout:', error.message);
    res.json({ loggedOut: true, warning: 'Could not stop watch or disconnect ngrok' });
  }
});

router.get('/gmail/latest', async (req, res) => {
  if (!userTokens) {
    return res.status(401).json({ error: 'Unauthorized. Please authenticate via /auth/google first.' });
  }

  try {
    // Ensure credentials are set
    setCredentials(userTokens);

    const emails = await getLatestEmails();
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch latest emails.', details: error.message });
  }
});
//start watch is for setting up Gmail push notifications via Pub/Sub
router.post('/gmail/start-watch', async (req, res) => {
  if (!userTokens) {
    return res.status(401).json({ error: 'Unauthorized. Please authenticate via /auth/google first.' });
  }

  try {
    // Ensure credentials are set
    setCredentials(userTokens);

    // Get webhook URL (ngrok in development, configured URL in production)
    const webhookUrl = await getWebhookUrl();
    console.log(`🔗 Using webhook URL: ${webhookUrl}`);

    const result = await setupGmailWatch(webhookUrl);
    res.json(result);
  } catch (error) {
    console.error('Error starting watch:', error.message);
    res.status(500).json({ error: 'Failed to set up Gmail watch', details: error.message });
  }
});

/**
 * Route: POST /gmail/stop-watch
 * Description: Stop monitoring new incoming emails via Gmail API watch
 */
router.post('/gmail/stop-watch', async (req, res) => {
  try {
    const result = await stopGmailWatch();
    res.json(result);
  } catch (error) {
    console.error('Error stopping watch:', error.message);
    res.status(500).json({ error: 'Failed to stop Gmail watch', details: error.message });
  }
});

/**
 * Route: GET /gmail/recent-emails
 * Description: Get recent emails to find message IDs for testing
 */
router.get('/gmail/recent-emails', async (req, res) => {
  try {
    if (!userTokens) {
      return res.status(401).json({ error: 'Not authenticated. Authenticate via /auth/google first' });
    }

    console.log('\n📧 FETCHING RECENT EMAILS FOR TESTING');

    // Ensure credentials are set
    setCredentials(userTokens);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get recent emails (last 10)
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
      q: 'in:inbox'
    });

    const messages = response.data.messages || [];

    // Get full details for each message
    const emailDetails = await Promise.all(
      messages.map(async (msg) => {
        try {
          const details = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['Subject', 'From', 'Date']
          });

          const headers = details.data.payload.headers;
          return {
            id: msg.id,
            subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
            from: headers.find(h => h.name === 'From')?.value || 'Unknown',
            date: headers.find(h => h.name === 'Date')?.value || 'Unknown',
            snippet: details.data.snippet
          };
        } catch (error) {
          console.error(`Error fetching message ${msg.id}:`, error.message);
          return { id: msg.id, error: 'Failed to fetch details' };
        }
      })
    );

    res.json({
      success: true,
      count: emailDetails.length,
      emails: emailDetails
    });
  } catch (error) {
    console.error('Recent emails error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route: POST /gmail/test-email
 * Description: Manually test email processing with a real message ID
 */
router.post('/gmail/test-email', async (req, res) => {
  try {
    if (!userTokens) {
      return res.status(401).json({ error: 'Not authenticated. Authenticate via /auth/google first' });
    }

    const { messageId } = req.body;
    if (!messageId) {
      return res.status(400).json({ error: 'messageId is required in request body' });
    }

    console.log(`\n🧪 MANUAL EMAIL TEST: Processing message ID ${messageId}`);

    // Ensure credentials are set
    setCredentials(userTokens);

    // Process the email directly
    await processNewEmail(messageId);

    res.json({
      success: true,
      message: `Test email processing initiated for message ID: ${messageId}`,
      messageId: messageId
    });
  } catch (error) {
    console.error('Test email error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route: POST /gmail/webhook
 * Description: Webhook endpoint to receive Gmail push notifications from Pub/Sub
 * This is called by Google Cloud when new emails arrive
 */
router.post('/gmail/webhook', async (req, res) => {
  console.log('\n🔔 WEBHOOK HIT! Gmail push notification received');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    // Acknowledge receipt immediately to satisfy Pub/Sub
    res.status(200).json({ acknowledged: true });

    // Parse the Pub/Sub message - it comes in format: { message: { data: 'base64_string', ... }, subscription: '...' }
    const message = req.body.message;
    if (!message) {
      console.warn('❌ No message in webhook request body');
      console.warn('Request body keys:', Object.keys(req.body));
      return;
    }

    console.log('✅ Message object found in webhook');
    console.log('Message keys:', Object.keys(message));
    console.log('Message data:', message.data);

    // Decode the Pub/Sub message (it's base64 encoded)
    let decodedMessage;
    try {
      const decodedString = Buffer.from(message.data, 'base64').toString();
      console.log('📄 Decoded base64 string:', decodedString);
      decodedMessage = JSON.parse(decodedString);
      console.log('✅ Parsed JSON notification:', decodedMessage);
    } catch (decodeError) {
      console.error('❌ Error decoding Pub/Sub message:', decodeError.message);
      return;
    }

    // CRITICAL: Handle authentication for webhook
    // In production, tokens might not be in memory, so load from persistent storage
    if (!userTokens) {
      console.log('⚠️ No user tokens in memory, loading from persistent storage...');
      userTokens = loadTokens();

      if (!userTokens) {
        console.warn('❌ No user tokens available in webhook. User needs to authenticate first.');
        console.log('💡 Solution: Complete OAuth flow via /auth/google before webhooks will work');
        console.log('🔄 For now, webhook will acknowledge but not process emails');

        // Still acknowledge the webhook to prevent Pub/Sub retries
        // But don't process the email since we can't authenticate
        return;
      }
    }

    console.log('✅ User tokens available, processing notification...');
    setCredentials(userTokens);
    await handleGmailNotification(decodedMessage);
    console.log('✅ Notification processed successfully');

  } catch (error) {
    console.error('❌ Error processing webhook:', error.message);
    console.error('Stack:', error.stack);
    // Still return 200 to prevent Pub/Sub from retrying
    res.status(200).json({ error: error.message });
  }
});

/**
 * Route: GET /gmail/webhook/status
 * Description: Check webhook authentication status
 * Useful for debugging webhook token availability
 */
router.get('/gmail/webhook/status', (req, res) => {
  const hasTokensInMemory = Boolean(userTokens);
  const tokensFileExists = fs.existsSync(path.join(__dirname, '..', 'tokens.json'));

  res.json({
    webhookReady: hasTokensInMemory || tokensFileExists,
    tokensInMemory: hasTokensInMemory,
    tokensFileExists: tokensFileExists,
    webhookUrl: process.env.GMAIL_WEBHOOK_URL || `${process.env.SERVER_URL || 'http://localhost:3000'}/gmail/webhook`,
    pubsubTopic: process.env.GMAIL_PUBSUB_TOPIC
  });
});

/**
 * Route: GET /gmail/watch/status
 * Description: Check Gmail watch status and processed messages
 */
router.get('/gmail/watch/status', (req, res) => {
  console.log('🔍 Gmail watch status check requested');

  const { processedMessages, watchHistoryId, isFetching, processedCount } = require('../services/gmailService.js').getState();

  const status = {
    timestamp: new Date().toISOString(),
    authenticated: Boolean(userTokens),
    watchActive: Boolean(watchHistoryId),
    historyId: watchHistoryId,
    processedMessagesCount: processedCount,
    currentlyFetching: isFetching,
    processedMessageIds: Array.from(processedMessages).slice(-10) // Last 10
  };

  console.log('📊 Gmail watch status:', status);
  res.json(status);
});

/**
 * Route: POST /gmail/test/email
 * Description: Manually trigger email processing for testing
 * Fetches latest emails and processes them (useful for testing without webhooks)
 */
router.post('/gmail/test/email', async (req, res) => {
  console.log('\n🧪 MANUAL EMAIL TEST TRIGGERED');

  try {
    if (!userTokens) {
      return res.status(401).json({ error: 'Not authenticated. Authenticate via /auth/google first' });
    }

    // Ensure credentials are set
    setCredentials(userTokens);

    console.log('📬 Fetching latest emails for testing...');
    const { getLatestEmails } = await import('../services/gmailService.js');
    const emails = await getLatestEmails();

    console.log(`✅ Found ${emails.length} emails to process`);

    // Process each email (this will trigger the console logs)
    for (const email of emails.slice(0, 3)) { // Process first 3 emails
      console.log(`🔄 Processing test email: ${email.id}`);
      // The getLatestEmails already processes emails, so we don't need to process again
      // But we can log them
    }

    res.json({
      success: true,
      emailsFound: emails.length,
      message: 'Test completed. Check server logs for email processing details.',
      emails: emails.map(e => ({
        id: e.id,
        subject: e.subject,
        from: e.from,
        timestamp: e.timestamp
      }))
    });
  } catch (error) {
    console.error('❌ Test email error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route: POST /predict
 * Description: Get prediction from external API and get Groq reasoning
 * Request body: { emailBody: string } or plain text
 * Response: { prediction: {...}, reasoning: {...}, timestamp: string }
 */
router.post('/predict', async (req, res) => {
  try {
    // Get the email body from the request
    const emailBody = typeof req.body === 'string' ? req.body : req.body?.emailBody;

    if (!emailBody) {
      return res.status(400).json({
        error: 'Missing email body in request',
      });
    }

    // Step 1: Get prediction from external API
    console.log('Sending to prediction API:', { text: emailBody });
    const prediction = await predict(emailBody);
    console.log('Prediction result:', prediction);

    // Step 2: Get reasoning from Groq agent about the prediction
    const reasoning = await reasonAboutPrediction(emailBody, prediction);

    // Step 3: Return combined response
    res.json({
      prediction,
      reasoning,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /predict:', error.message);
    res.status(500).json({
      error: 'Failed to process email',
      details: error.message,
    });
  }
});

export default router;
