/**
 * Get webhook URL. In production it must be explicitly set.
 * In development, defaults to local server URL (no ngrok required).
 * @returns {string} Webhook URL
 */
export function getWebhookUrl() {
  const webhookUrl = process.env.GMAIL_WEBHOOK_URL;

  if (webhookUrl && webhookUrl.trim()) {
    return webhookUrl;
  }

  // For local development, assume local webhook exposed directly
  return `${process.env.SERVER_URL || 'http://localhost:2000'}/gmail/webhook`;
}

/**
 * No-op disconnect function to satisfy route cleanup API when ngrok is not used.
 */
export async function disconnectNgrok() {
  // no action required when ngrok is not used
  return;
}