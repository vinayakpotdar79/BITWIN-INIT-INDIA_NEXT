import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Token storage file path
const TOKEN_FILE = path.join(__dirname, '..', 'tokens.json');

/**
 * Save user tokens to persistent storage
 * @param {Object} tokens - OAuth tokens
 */
export function saveTokens(tokens) {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    console.log('✅ Tokens saved to persistent storage');
  } catch (error) {
    console.error('❌ Error saving tokens:', error.message);
  }
}

/**
 * Load user tokens from persistent storage
 * @returns {Object|null} OAuth tokens or null if not found
 */
export function loadTokens() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
      console.log('✅ Tokens loaded from persistent storage');
      return tokens;
    }
  } catch (error) {
    console.error('❌ Error loading tokens:', error.message);
  }
  return null;
}

/**
 * Clear stored tokens
 */
export function clearTokens() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      fs.unlinkSync(TOKEN_FILE);
      console.log('✅ Tokens cleared from persistent storage');
    }
  } catch (error) {
    console.error('❌ Error clearing tokens:', error.message);
  }
}