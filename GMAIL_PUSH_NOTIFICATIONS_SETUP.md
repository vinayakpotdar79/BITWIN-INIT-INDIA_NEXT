# Gmail Push Notifications Setup Guide

This guide walks you through setting up Gmail Push Notifications to replace polling with real-time webhook updates.

## Overview

**Previous Architecture:** Server polls Gmail API every 20 seconds (inefficient)  
**New Architecture:** Gmail sends push notifications → Pub/Sub → Your webhook → Socket.io

## Prerequisites

- Google Cloud Project (with billing enabled)
- Gmail API enabled in Google Cloud Console
- OAuth 2.0 credentials set up
- Node.js server with public URL (for production) or ngrok (for development)

## Step 1: Create a Pub/Sub Topic in Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Pub/Sub** → **Topics**
3. Click **Create Topic** and name it `gmail-notifications`
4. Copy the topic name (format: `projects/YOUR_PROJECT_ID/topics/gmail-notifications`)

## Step 2: Set up Ngrok for Development Webhooks

For development, you need to expose your local server to the internet so Google can send webhook notifications. We'll use ngrok for this.

### Install ngrok globally (optional)
```bash
npm install -g ngrok
# OR download from https://ngrok.com/download
```

### Start Development with ngrok

The server now includes built-in ngrok support. Use these commands:

```bash
# Install dependencies (already done)
npm install

# Start server with ngrok tunnel (recommended for development)
npm run dev:ngrok

# This will:
# 1. Start your Node.js server on port 3000
# 2. Start ngrok tunnel to expose port 3000
# 3. Automatically use the ngrok URL for Gmail webhooks
```

### Alternative: Manual ngrok setup

If you prefer to run ngrok separately:

```bash
# Terminal 1: Start your server
npm run dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and use it in your `.env`:

```env
GMAIL_WEBHOOK_URL=https://abc123.ngrok.io/gmail/webhook
```

### Ngrok Features Used

- **Automatic URL detection**: Server automatically gets ngrok URL in development
- **Production fallback**: Uses `GMAIL_WEBHOOK_URL` env var in production
- **Clean disconnect**: Ngrok tunnel closes on logout in development

## Step 3: Get Service Account Key for Pub/Sub Authentication

1. Go to Google Cloud Console → **Service Accounts**
2. Click **Create Service Account**
3. Name it `gmail-push-notifications`
4. Grant it **Pub/Sub Editor** role
5. Create a JSON key and download it
6. Store it securely (mentioned in .env as `GOOGLE_APPLICATION_CREDENTIALS`)

## Step 4: Update Environment Variables

Add to your `.env` file:

```env
# Gmail Push Notifications Setup
GMAIL_PUBSUB_TOPIC=projects/YOUR_PROJECT_ID/topics/gmail-notifications
GMAIL_WEBHOOK_URL=https://yourdomain.com/gmail/webhook
SERVER_URL=https://yourdomain.com

# Service account for Pub/Sub (optional, if using service account auth)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Step 5: Test the Setup

#### Test 1: Verify ngrok and server are working
```bash
# Start development server with ngrok
npm run dev:ngrok

# In another terminal, test the setup
npm run test:ngrok
```

#### Test 2: Authenticate user
1. User clicks `/auth/google` in your app
2. After OAuth callback, call `POST /gmail/start-watch`
3. Check server logs for: `✅ Gmail watch set up successfully`

#### Test 3: Receive notifications
1. Send an email to the authenticated Gmail account
2. Check server logs for: `📧 Gmail notification received`
3. Verify Socket.io emits `new-email` event to frontend

## Step 6: Deploy to Production

### Option A: Vercel
```bash
npm install
vercel deploy
```

### Option B: Railway/Render/Heroku
Update `GMAIL_WEBHOOK_URL` to your production domain

### Option C: Self-hosted
1. Get a public domain with SSL certificate
2. Forward port 3000 to your server
3. Update `GMAIL_WEBHOOK_URL` in `.env`

## Troubleshooting

### "Invalid topic name" error
- Verify `GMAIL_PUBSUB_TOPIC` format: `projects/your-project-id/topics/gmail-notifications`
- Check Pub/Sub topic exists in Google Cloud Console

### Webhook not receiving messages
```bash
# Check if webhook is reachable
curl -I https://yourdomain.com/gmail/webhook

# Check Pub/Sub subscription in Google Cloud Console
# Look at "Delivery status" to see active subscriptions
```

### "Unauthorized" error on watch setup
- Verify user is authenticated (`/auth/status` returns true)
- Check OAuth token is valid and has Gmail API scope

### Emails not being processed
1. Check server logs for notification receipt
2. Verify `userTokens` are set after OAuth
3. Try calling `/gmail/latest` to test basic Gmail API access

## Email Processing Flow

```
Gmail API → Google Pub/Sub → HTTP POST to /gmail/webhook
    ↓
Parse Pub/Sub message (base64 decode)
    ↓
Extract messageId from notification
    ↓
Fetch full email from Gmail API
    ↓
Extract email data (subject, body, sender)
    ↓
Predict if spam/phishing (AI model)
    ↓
Get reasoning from Groq agent
    ↓
Emit "new-email" event via Socket.io
    ↓
Frontend receives real-time notification
```

## API Reference

### POST /gmail/start-watch
Sets up Gmail push notifications

**Request:**
```bash
POST /gmail/start-watch
Authorization: Required (user must be authenticated)
```

**Response:**
```json
{
  "status": "watch_set",
  "historyId": "12345",
  "expiration": "2026-05-01T00:00:00Z"
}
```

### POST /gmail/stop-watch
Stops Gmail push notifications

**Request:**
```bash
POST /gmail/stop-watch
```

**Response:**
```json
{
  "status": "watch_stopped"
}
```

### POST /gmail/webhook
Receives Gmail push notifications (called by Google)

**Request (from Google Pub/Sub):**
```json
{
  "message": {
    "data": "base64_encoded_payload",
    "messageId": "12345",
    "publishTime": "2026-04-01T00:00:00Z"
  },
  "subscription": "projects/your-project/subscriptions/gmail-notifications-push"
}
```

**Response:**
```json
{
  "acknowledged": true
}
```

## Performance Benefits

| Metric | Polling (20s interval) | Push Notifications |
|--------|----------------------|------------------|
| **Real-time latency** | ~20 seconds | <1 second |
| **API calls/hour** | 180 | Only when emails arrive |
| **Server load** | Consistent, wasteful | Event-driven, efficient |
| **Cost (Gmail API)** | High quota usage | Minimal quota usage |

## Migration Checklist

- [ ] Create Pub/Sub topic in Google Cloud
- [ ] Create Pub/Sub subscription with push endpoint
- [ ] Get service account key
- [ ] Update `.env` with topic name and webhook URL
- [ ] Verify webhook is publicly accessible
- [ ] Test `/gmail/start-watch` endpoint
- [ ] Send test email and verify Socket.io event
- [ ] Update frontend to handle real-time updates
- [ ] Deploy to production
- [ ] Monitor server logs for errors

## Support

For Gmail API documentation: https://developers.google.com/gmail/api/guides/push  
For Pub/Sub documentation: https://cloud.google.com/pubsub/docs
