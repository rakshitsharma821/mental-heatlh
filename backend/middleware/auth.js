// ============================================
// MindCare Backend — JWT Authentication & RBAC Middleware
// Enforces Active Account Status & Therapist Approval Verification
// ============================================

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from '../models/db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing in middleware.');
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication token required.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, publicId, email, role, name }

    // Check user status in database on authenticated requests
    const userRes = await db.query('SELECT status, role, public_id FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Account not found.'
      });
    }

    const dbUser = userRes.rows[0];
    if (dbUser.status && dbUser.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Account is ${dbUser.status}. Access denied.`
      });
    }

    // Keep role and public_id up-to-date with DB
    req.user.role = dbUser.role;
    req.user.publicId = dbUser.public_id;
    req.user.status = dbUser.status;

    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid or expired session token.'
    });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (e) {
    req.user = null;
  }
  next();
}

export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access restricted: Requires one of [${allowedRoles.join(', ')}] role.`
      });
    }

    // If therapist role, verify approved status
    if (req.user.role === 'therapist') {
      try {
        const tpRes = await db.query('SELECT verification_status FROM therapist_profiles WHERE user_id = $1', [req.user.id]);
        if (tpRes.rows.length === 0 || tpRes.rows[0].verification_status !== 'approved') {
          return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'Therapist account is not approved. Access restricted until verified and approved.'
          });
        }
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to verify therapist credentials.' });
      }
    }

    next();
  };
}

export const requireTherapist = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required.' });
  }

  if (req.user.role !== 'therapist') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Access restricted: Requires approved therapist.'
    });
  }

  try {
    const tpRes = await db.query('SELECT verification_status FROM therapist_profiles WHERE user_id = $1', [req.user.id]);
    if (tpRes.rows.length === 0 || tpRes.rows[0].verification_status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Therapist account is not approved. Access restricted until approved.'
      });
    }
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to verify therapist verification status.' });
  }
};

/**
 * Allows any therapist (even unapproved/documents_pending) to access their own verification profile & vault
 */
export const requireAnyTherapist = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required.' });
  }

  if (req.user.role === 'therapist') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden',
    message: 'Access restricted to clinical practitioners.'
  });
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Access restricted: Requires administrator privileges.'
    });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Access restricted: Requires Super Administrator privileges.'
    });
  }
  next();
};
