// ============================================
// MindCare Sanctuary — Clinical Vault Storage Service
// Handles:
// - Magic bytes file validation (PDF, JPG, PNG)
// - Path traversal prevention & safe random keys
// - Pluggable malware scanning hook
// - Private storage interface (no direct public URLs)
// - Short-lived signed download tokens
// ============================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { CLINICAL_CONFIG } from '../../shared/clinicalConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT_DIR = path.resolve(__dirname, '..', 'uploads', 'clinical_vault');
const JWT_SECRET = process.env.JWT_SECRET;

// Ensure private vault directory exists
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

/**
 * Validates buffer against file type magic bytes
 */
export function validateMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 3) return false;

  const isPdf = buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46; // %PDF-

  const isJpeg = buffer.length >= 3 &&
    buffer[0] === 0xFF &&
    buffer[1] === 0xD8 &&
    buffer[2] === 0xFF; // JPEG SOI

  const isPng = buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A; // PNG header

  if (mimeType === 'application/pdf') return isPdf;
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/pjpeg') return isJpeg;
  if (mimeType === 'image/png') return isPng;

  // Fallback: if magic bytes identify any of our 3 accepted types
  return isPdf || isJpeg || isPng;
}

/**
 * Pluggable malware scanner hook
 */
export async function scanForMalware(buffer, filename) {
  if (!buffer || buffer.length === 0) {
    return { safe: false, reason: 'Empty file buffer' };
  }

  // Detect PE / DOS executable headers (MZ)
  if (buffer.length >= 2 && buffer[0] === 0x4D && buffer[1] === 0x5A) {
    return { safe: false, reason: 'Executable PE / DOS signature detected' };
  }

  // Detect ELF executable headers (7F 45 4C 46)
  if (buffer.length >= 4 && buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
    return { safe: false, reason: 'ELF executable binary signature detected' };
  }

  // Detect shell scripts / HTML script tags inside image or pdf
  const headerSample = buffer.slice(0, 1024).toString('utf-8', 0, Math.min(buffer.length, 1024)).toLowerCase();
  if (headerSample.includes('<script') || headerSample.includes('javascript:') || headerSample.includes('<?php')) {
    return { safe: false, reason: 'Disallowed active executable code embedded in file' };
  }

  return { safe: true };
}

export const clinicalStorage = {
  /**
   * Validates and saves an uploaded document buffer to the private vault
   */
  saveDocument: async (therapistId, docType, originalFilename, buffer, rawMimeType) => {
    // 1. Validate doc_type
    const typeDef = CLINICAL_CONFIG.documentRules.types[docType];
    if (!typeDef) {
      throw new Error(`Invalid document type: ${docType}`);
    }

    // 2. Validate file size
    if (buffer.length > CLINICAL_CONFIG.documentRules.maxFileSizeBytes) {
      throw new Error(`File size exceeds maximum permitted limit (${CLINICAL_CONFIG.documentRules.maxFileSizeMB} MB)`);
    }

    // 3. Normalize MIME type & validate extension
    let mimeType = (rawMimeType || '').toLowerCase();
    const ext = path.extname(originalFilename || '').toLowerCase();

    if (mimeType === 'image/jpg' || mimeType === 'image/pjpeg') {
      mimeType = 'image/jpeg';
    } else if (!mimeType || mimeType === 'application/octet-stream') {
      if (ext === '.pdf') mimeType = 'application/pdf';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    }

    if (!CLINICAL_CONFIG.documentRules.allowedMimeTypes.includes(mimeType) && mimeType !== 'image/jpg') {
      throw new Error(`Unsupported MIME type: ${rawMimeType || 'unknown'}. Only PDF, JPG, and PNG are allowed.`);
    }

    // 4. Validate extension and guard against path traversal
    if (!CLINICAL_CONFIG.documentRules.allowedExtensions.includes(ext)) {
      throw new Error(`Invalid file extension: ${ext}`);
    }

    const baseName = path.basename(originalFilename || '');
    if (baseName.includes('..') || baseName.includes('/') || baseName.includes('\\') || baseName.includes('\0')) {
      throw new Error('Path traversal detected in file name');
    }

    // 5. Validate magic bytes (or detect and align)
    const isValidBytes = validateMagicBytes(buffer, mimeType);
    if (!isValidBytes) {
      throw new Error('File content does not match reported MIME type (magic bytes mismatch)');
    }

    // 6. Malware scanning hook
    const scanResult = await scanForMalware(buffer, originalFilename);
    if (!scanResult.safe) {
      throw new Error(`Security validation failed: ${scanResult.reason}`);
    }

    // 7. Store with randomized key in private vault
    const storageKey = `doc_${crypto.randomUUID()}${ext}`;
    const filePath = path.join(VAULT_DIR, storageKey);

    await fs.promises.writeFile(filePath, buffer, { mode: 0o600 });

    return {
      storageKey,
      fileSize: buffer.length,
      mimeType,
      docType,
      originalFilename: baseName
    };
  },

  /**
   * Returns file path from vault after verifying path traversal safety
   */
  getFilePath: (storageKey) => {
    const safeKey = path.basename(storageKey);
    const resolvedPath = path.resolve(VAULT_DIR, safeKey);
    if (!resolvedPath.startsWith(VAULT_DIR)) {
      throw new Error('Path traversal violation');
    }
    if (!fs.existsSync(resolvedPath)) {
      return null;
    }
    return resolvedPath;
  },

  /**
   * Deletes a file from vault
   */
  deleteFile: async (storageKey) => {
    try {
      const filePath = clinicalStorage.getFilePath(storageKey);
      if (filePath && fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (e) {
      console.warn('Error unlinking vault file:', e.message);
    }
  },

  /**
   * Generates a short-lived signed token for document download
   */
  generateDownloadToken: (docId, userId, role) => {
    return jwt.sign(
      { docId, userId, role, scope: 'doc_download' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  },

  /**
   * Verifies signed token
   */
  verifyDownloadToken: (token) => {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.scope !== 'doc_download') return null;
      return payload;
    } catch (_) {
      return null;
    }
  }
};
