import { google } from 'googleapis';
import { oauth2Client } from '../config/googleOAuth.js';
import { getIo } from '../socket/socketServer.js';
import { extractEmailData } from '../utils/emailParser.js';
import { predict } from './predictService.js';
import { reasonAboutPrediction } from './agentService.js';

// State to track processed messages and watch subscription
class GmailServiceState {
  constructor() {
    this.processedMessages = new Set();
    this.watchHistoryId = null;
    this.isFetching = false;
  }
}

const state = new GmailServiceState();

export async function getLatestEmails() {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Fetch latest messages from INBOX and SPAM
    const inboxResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 10,
    });

    const spamResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['SPAM'],
      maxResults: 5, // Fetch fewer from spam to keep initial load fast
    });

    const inboxMessages = (inboxResponse.data.messages || []).slice(0, 3);
    const spamMessages = (spamResponse.data.messages || []).slice(0, 2);

    const messages = [...inboxMessages, ...spamMessages];
    
    const extractedEmails = [];

    for (const message of messages) {
      // Add a small delay between processing emails to stagger load on Groq API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const emailData = await extractEmailData(gmail, message.id);
      if (emailData) {
        state.processedMessages.add(message.id);
        
        // Mark as spam if it has the SPAM label
        emailData.isSpam = emailData.labelIds?.includes('SPAM');
        
        // Enrich with prediction and reasoning
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

        extractedEmails.push(emailData);
      }
    }

    return extractedEmails;
  } catch (error) {
    console.error('Error fetching latest emails:', error.message);
    throw error;
  }
}

export async function processNewEmail(messageId) {
  if (state.isFetching) return; // Prevent overlap
  state.isFetching = true;

  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 🎉 CLEAR CONSOLE LOG FOR NEW EMAIL RECEIVED
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📧 NEW EMAIL RECEIVED! Processing message ID: ${messageId}`);
    console.log(`${'='.repeat(80)}\n`);

    console.log(`🔍 Processing email: ${messageId}`);

    // Process only if it has not been seen
    if (state.processedMessages.has(messageId)) {
      console.log(`⏭️ Email already processed: ${messageId}`);
      return;
    }

    console.log(`⏳ Waiting before processing to stagger API load...`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const emailData = await extractEmailData(gmail, messageId);
    console.log(`📨 Email data extracted:`, { subject: emailData?.subject, from: emailData?.from });
    
    if (emailData) {
      // Mark as spam if it has the SPAM label
      emailData.isSpam = emailData.labelIds?.includes('SPAM');

      // Enrich with prediction and reasoning
      try {
        console.log(`🤖 Predicting spam/phishing...`);
        const prediction = await predict(emailData.body);
        const reasoning = await reasonAboutPrediction(emailData.body, prediction);
        emailData.prediction = prediction;
        emailData.reasoning = reasoning;
        console.log(`✅ Prediction complete:`, { prediction, hasReasoning: !!reasoning });
      } catch (enrichError) {
        console.error(`❌ Error enriching email ${messageId}:`, enrichError.message);
        emailData.prediction = null;
        emailData.reasoning = null;
      }

      // Log structured JSON as required for monitoring
      const logEntry = {
        subject: emailData.subject,
        from: emailData.from,
        body: emailData.body,
        timestamp: emailData.timestamp,
        prediction: emailData.prediction,
        reasoning: emailData.reasoning
      };
      
      console.log('📊 Final email data:', JSON.stringify(logEntry, null, 2));

      // Emit real-time event via Socket.io
      console.log(`📡 Emitting Socket.io event 'new-email'...`);
      const io = getIo();
      console.log(`Socket.io instance available: ${!!io}`);
      
      // Get all connected clients
      const connectedClients = io.sockets.sockets.size;
      console.log(`📊 Connected clients: ${connectedClients}`);
      
      if (connectedClients > 0) {
        // Emit to all connected clients
        io.sockets.emit('new-email', emailData);
        console.log(`✅ Socket.io event emitted successfully to ${connectedClients} client(s)`);
      } else {
        console.warn(`⚠️ No clients connected, event not emitted`);
      }

      // Mark as processed
      state.processedMessages.add(messageId);
      console.log(`✅ Email marked as processed. Total processed: ${state.processedMessages.size}`);

      // 🎉 FINAL SUCCESS LOG
      console.log(`\n${'='.repeat(80)}`);
      console.log(`✅ EMAIL PROCESSING COMPLETE!`);
      console.log(`   📧 Subject: "${emailData.subject}"`);
      console.log(`   👤 From: ${emailData.from}`);
      console.log(`   🤖 Prediction: ${emailData.prediction || 'N/A'}`);
      console.log(`   📱 Real-time update sent via Socket.io`);
      console.log(`${'='.repeat(80)}\n`);
    } else {
      console.warn(`⚠️ No email data extracted for ${messageId}`);
    }
  } catch (error) {
    console.error('❌ Error processing new email:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    state.isFetching = false;
  }
}

/**
 * Handle incoming Gmail webhook notification
 * Called when Gmail sends a push notification about new emails
 */
export async function handleGmailNotification(notification) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📧 HANDLE GMAIL NOTIFICATION CALLED`);
    console.log(`${'='.repeat(60)}`);
    console.log('Notification object:', JSON.stringify(notification, null, 2));

    // notification contains: { emailAddress, historyId }
    const { emailAddress, historyId } = notification;

    console.log(`📧 Gmail notification received for ${emailAddress} (historyId: ${historyId})`);

    if (!historyId) {
      console.log('⚠️ No historyId in notification, fetching latest emails...');
      // Fallback: fetch latest emails
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 5,
      });

      const messages = response.data.messages || [];
      console.log(`📬 Found ${messages.length} latest emails to process`);
      for (const message of messages) {
        await processNewEmail(message.id);
      }
      return;
    }

    // Fetch new messages since last historyId
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    console.log(`📖 Using history API with historyId ${state.watchHistoryId || historyId}...`);
    try {
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: state.watchHistoryId || historyId,
        historyTypes: ['messageAdded'],
      });

      const history = historyResponse.data.history || [];
      console.log(`✅ History response received with ${history.length} entries`);

      let totalMessagesAdded = 0;
      for (const entry of history) {
        if (entry.messagesAdded) {
          console.log(`📨 Found ${entry.messagesAdded.length} messagesAdded entries`);
          for (const item of entry.messagesAdded) {
            totalMessagesAdded++;
            console.log(`🔄 Processing new message: ${item.message.id}`);
            await processNewEmail(item.message.id);
          }
        }
      }

      console.log(`✅ Processed ${totalMessagesAdded} new messages from history`);

      // Update stored historyId
      if (historyResponse.data.historyId) {
        state.watchHistoryId = historyResponse.data.historyId;
        console.log(`✅ Updated historyId to: ${state.watchHistoryId}`);
      }
    } catch (historyError) {
      console.error('❌ History API error (likely old historyId):', historyError.message);
      console.log('Falling back to fetching latest emails...');
      // Fallback to fetching latest
      const latestResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 5,
      });

      const messages = latestResponse.data.messages || [];
      console.log(`📬 Found ${messages.length} latest emails in fallback`);
      for (const message of messages) {
        await processNewEmail(message.id);
      }
    }

    console.log(`${'='.repeat(60)}\n`);
  } catch (error) {
    console.error('❌ Error handling Gmail notification:', error.message);
    console.error('Stack:', error.stack);
  }
}

/**
 * Set up Gmail watch for push notifications
 * Requires Google Cloud Pub/Sub setup and webhook URL configured
 */
export async function setupGmailWatch(webhookUrl) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`⚙️ SETTING UP GMAIL WATCH`);
    console.log(`${'='.repeat(60)}`);
    
    const topicName = process.env.GMAIL_PUBSUB_TOPIC || 'projects/your-project/topics/gmail-notifications';
    console.log('topicName:', topicName);
    console.log(`📋 Configuration:`);
    console.log(`   Topic: ${topicName}`);
    console.log(`   Labels: INBOX, SPAM`);
    console.log(`   Webhook URL: ${webhookUrl}`);
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    console.log(`🔄 Calling gmail.users.watch()...`);
    const watchResponse = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: topicName,
        labelIds: ['INBOX', 'SPAM'],
      },
    });

    state.watchHistoryId = watchResponse.data.historyId;
    console.log(`✅ Gmail watch set up successfully!`);
    console.log(`   historyId: ${state.watchHistoryId}`);
    console.log(`   Expiration: ${watchResponse.data.expiration || 'N/A'}`);
    console.log(`${'='.repeat(60)}\n`);
    
    return {
      status: 'watch_set',
      historyId: state.watchHistoryId,
      expiration: watchResponse.data.expiration,
      topicName: topicName,
    };
  } catch (error) {
    console.error('❌ Error setting up Gmail watch:', error.message);
    console.error('Error code:', error.code);
    console.error('Stack:', error.stack);
    throw error;
  }
}

/**
 * Stop Gmail watch
 */
export async function stopGmailWatch() {
  try {
    console.log(`\n🛑 Stopping Gmail watch...`);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    await gmail.users.stop({
      userId: 'me',
    });

    state.watchHistoryId = null;
    console.log(`✅ Gmail watch stopped.\n`);
    return { status: 'watch_stopped' };
  } catch (error) {
    console.error('Error stopping Gmail watch:', error.message);
    throw error;
  }
}

/**
 * Get current Gmail service state for debugging
 */
export function getState() {
  return {
    processedMessages: state.processedMessages,
    watchHistoryId: state.watchHistoryId,
    isFetching: state.isFetching,
    processedCount: state.processedMessages.size
  };
}
