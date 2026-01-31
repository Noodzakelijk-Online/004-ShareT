/**
 * Native Crypto Utility
 * Uses Node.js built-in crypto module instead of crypto-js
 * 
 * Benefits:
 * - No external dependency
 * - Faster performance (native C++ bindings)
 * - More secure (uses OpenSSL)
 * - Smaller bundle size
 */

const crypto = require('crypto');

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Get encryption key from environment or generate one
 * @returns {Buffer} - 32-byte encryption key
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  // If key is exactly 32 bytes, use it directly
  if (key.length === 32) {
    return Buffer.from(key, 'utf8');
  }
  
  // Otherwise, derive a 32-byte key using PBKDF2
  return crypto.pbkdf2Sync(key, 'sharet-salt', 100000, 32, 'sha256');
}

/**
 * Encrypt a string
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text (base64 encoded)
 */
function encrypt(text) {
  if (!text) return text;
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + AuthTag + Encrypted data
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'hex'),
  ]);
  
  return combined.toString('base64');
}

/**
 * Decrypt a string
 * @param {string} encryptedText - Encrypted text (base64 encoded)
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedText, 'base64');
  
  // Extract IV, AuthTag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Hex-encoded random token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a URL-safe random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - URL-safe base64 encoded token
 */
function generateUrlSafeToken(length = 32) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Hash a string using SHA-256
 * @param {string} text - Text to hash
 * @returns {string} - Hex-encoded hash
 */
function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a secure share link ID
 * @returns {string} - 16-character URL-safe ID
 */
function generateShareId() {
  return generateUrlSafeToken(12).substring(0, 16);
}

/**
 * Compare two strings in constant time (timing-safe)
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings are equal
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  
  if (bufA.length !== bufB.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generate a random UUID v4
 * @returns {string} - UUID v4 string
 */
function generateUUID() {
  return crypto.randomUUID();
}

module.exports = {
  encrypt,
  decrypt,
  generateToken,
  generateUrlSafeToken,
  hash,
  generateShareId,
  timingSafeEqual,
  generateUUID,
};
