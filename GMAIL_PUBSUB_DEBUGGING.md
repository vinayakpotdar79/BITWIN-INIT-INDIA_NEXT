# Gmail Pub/Sub Real-Time Updates - Debugging Guide

This guide helps you verify that Gmail Push Notifications are working correctly.

## Quick Test Flow

### Step 1: Start Your Server
```bash
npm run dev
# or
npm start
```

### Step 2: Authenticate (This Now Saves Tokens Persistently)
1. Visit: `http://localhost:2000/auth/google`
2. Complete OAuth flow
3. You should be redirected back with `?auth=success`
4. **NEW**: Tokens are now saved to `server/tokens.json` for webhook access

### Step 3: Verify Authentication & Persistent Storage
```bash
# Check auth status
curl http://localhost:2000/auth/status
# Expected response: { "authenticated": true }

# Check webhook authentication status (NEW)
curl http://localhost:2000/gmail/webhook/status
# Expected response: { "webhookReady": true, "tokensInMemory": true, "tokensFileExists": true, ... }

# Check if tokens.json exists (contains OAuth tokens)
ls -la server/tokens.json
```

### Step 4: Set Up Gmail Watch
```bash
curl -X POST http://localhost:2000/gmail/start-watch
# Expected response: { "status": "watch_set", "historyId": "...", ... }
```

Check server logs. You should see:
```
============================================================
⚙️ SETTING UP GMAIL WATCH
============================================================
📋 Configuration:
   Topic: projects/alien-slice-490409-e7/topics/gmail-notifications
   Labels: INBOX, SPAM
   Webhook URL: https://gmail-hook.onrender.com/gmail/webhook
🔄 Calling gmail.users.watch()...
✅ Gmail watch set up successfully!
   historyId: 123456789
   Expiration: ...
============================================================
```

### Step 5: Test Webhook with Manual Call (Simulates Pub/Sub)

This tests the entire flow WITHOUT needing to send an actual email:

```bash
curl -X POST http://localhost:2000/gmail/webhook/test \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Test webhook executed. Check server logs for details."
}
```

Check server logs for the full processing flow:
```
🧪 TEST WEBHOOK CALLED
📤 Sending test message: { message: { data: '...', ... }, ... }

============================================================
📧 HANDLE GMAIL NOTIFICATION CALLED
============================================================
Notification object: { emailAddress: "test@gmail.com", historyId: "123456789" }
📧 Gmail notification received for test@gmail.com (historyId: 123456789)
📖 Using history API with historyId 123456789...
✅ History response received with ... entries
```

---

## Step 6: Send a Real Email And Verify Real-Time Updates

1. From another email account, send an email to your authenticated Gmail
2. **Check Render deployment logs** at: `https://dashboard.render.com/` 
   - Look for the gmail-hook service
   - You should see a `POST /gmail/webhook` request
3. Check your server logs for:
   ```
   🔔 Webhook received request
   Request body: { "message": { "data": "...", ... }, ... }
   ✅ Message object found in webhook
   📧 HANDLE GMAIL NOTIFICATION CALLED
   ```

---

## Verification Checklist

### Webhook Endpoint Checks
- [ ] `POST /gmail/webhook` logs show incoming Pub/Sub messages
- [ ] Message is properly base64 decoded
- [ ] **NEW**: Tokens are loaded from persistent storage (`server/tokens.json`)
- [ ] `userTokens` are available (logged as: `✅ User tokens available`)
- [ ] `handleGmailNotification()` is called

### Gmail Watch Setup
- [ ] `POST /gmail/start-watch` returns `status: "watch_set"`
- [ ] `historyId` is saved in state
- [ ] Pub/Sub topic matches `.env` `GMAIL_PUBSUB_TOPIC`

### Email Processing
- [ ] `handleGmailNotification()` receives the notification
- [ ] History API call succeeds (or fallback to latest)
- [ ] New messageIDs are extracted
- [ ] `processNewEmail()` is called for each message

### Real-Time Updates (Socket.io)
- [ ] `✅ Socket.io event emitted successfully` in logs
- [ ] `new-email` event is broadcast with email data
- [ ] Frontend receives the Socket.io event

---

## Troubleshooting

### Issue: Webhook not processing emails (tokens not available)

**Symptoms:**
```
⚠️ No user tokens in memory, loading from persistent storage...
❌ No user tokens available in webhook
```

**Root Cause:** 
Webhooks run in separate HTTP requests and don't have access to in-memory tokens.

**Solution Applied:**
- ✅ Implemented persistent token storage in `server/tokens.json`
- ✅ Webhook now loads tokens from file when needed
- ✅ Tokens persist across server restarts

**Verification:**
```bash
# Check if tokens file exists
ls -la server/tokens.json

# Should contain OAuth tokens like:
{
  "access_token": "...",
  "refresh_token": "...",
  "expiry_date": 1234567890
}
```

### Issue: No Socket.io event emitted

**Check 1: userTokens Check**
```
⚠️ User tokens not available to process notification
```
- Solution: Ensure OAuth flow completed successfully
- Test: `GET /auth/status` should return `{ authenticated: true }`

**Check 2: Socket.io Not Connected**
```
⚠️ Socket.io instance: false
```
- Solution: Frontend should establish Socket.io connection
- Test: Check browser console for Socket.io connection

---

## Log Markers to Look For

**Successful Flow:**
```
✅ Gmail watch set up successfully
✅ Message object found
✅ User tokens available
✅ Notification processed successfully
🔍 Processing email: msg-id-123
✅ Prediction complete
📡 Emitting Socket.io event 'new-email'...
✅ Socket.io event emitted successfully
```

**Failure Points:**
```
❌ Error handling Gmail notification
❌ History API error
⚠️ User tokens not available
⚠️ No message in webhook request body
```

---

## Testing with Test Endpoint

The `/gmail/webhook/test` endpoint simulates incoming Pub/Sub messages:

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Authenticate
curl http://localhost:2000/auth/google  # complete OAuth

# Terminal 3: Set up watch
curl -X POST http://localhost:2000/gmail/start-watch

# Terminal 4: Trigger test webhook
curl -X POST http://localhost:2000/gmail/webhook/test

# Watch Terminal 1 for complete log output
```

---

## Next Steps

If everything checks out:
1. **Verify Pub/Sub Configuration** in Google Cloud Console
2. **Send a real email** to your authenticated Gmail account
3. **Monitor Render logs** for incoming webhook requests
4. **Check frontend** for Socket.io `new-email` event emission

If issues persist:
- Check error logs with full stack traces
- Verify `GMAIL_PUBSUB_TOPIC` and `GMAIL_WEBHOOK_URL` in `.env`
- Ensure Pub/Sub subscription is still active (24-hour expiry)
