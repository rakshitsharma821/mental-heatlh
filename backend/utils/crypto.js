// ============================================
// MindCare Backend — Cryptographic Security Utility
// AES-256-GCM Field-Level Encryption & Key Derivation
// ============================================

import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM

// Ensure 32-byte key
function getEncryptionKey() {
  const envKey = process.env.ENCRYPTION_KEY || 'mindcare-sanctuary-fallback-key-32b!';
  // Hash or pad to guarantee exactly 32 bytes
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns { ciphertext: hex, iv: hex, authTag: hex }
 */
export function encryptField(plainText) {
  if (plainText === null || plainText === undefined) {
    return { ciphertext: '', iv: '', authTag: '' };
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(String(plainText), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag
  };
}

/**
 * Decrypt an AES-256-GCM encrypted payload.
 */
export function decryptField(ciphertext, ivHex, authTagHex) {
  if (!ciphertext || !ivHex || !authTagHex) {
    return '';
  }
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return '[Decryption Error: Tampered or Invalid Key]';
  }
}

/**
 * Hash password with unique salt using scrypt (Node.js crypto)
 */
export function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * Generate cryptographically secure random salt
 */
export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}
