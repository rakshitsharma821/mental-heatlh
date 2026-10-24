// ============================================
// MindCare Backend — Admin Routes (Part 4: Admin System & Governance)
// Strictly protected: Requires valid JWT with role = 'admin' or 'super_admin'
// Zero exposure of client private journal entries, mood notes, or companion words.
// ============================================

import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply auth + requireAdmin to all routes in this router
router.use(authenticateToken);
router.use(requireAdmin);

// ── 1. Overview & Health Metrics ──
router.get('/overview', adminController.getOverview);
router.get('/stats', adminController.getOverview);

// ── 2. Therapist Verification Queue & Dossier ──
router.get('/therapists/queue', adminController.getTherapistQueue);
router.get('/therapists/:id/dossier', adminController.getTherapistDossier);
router.post('/therapists/:id/documents/:docId/review', adminController.reviewTherapistDocument);
router.post('/therapists/:id/verification-decision', adminController.makeVerificationDecision);

// ── 3. Users, Assignments & DPDP Anonymization ──
router.get('/users', adminController.getUsers);
router.get('/therapists/:id/assigned-clients', adminController.getTherapistAssignedClients);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.post('/users/:id/force-password-reset', adminController.forcePasswordReset);
router.delete('/users/:id', adminController.deleteUserOnRequest);

// ── 4. Session Request Pipeline ──
router.get('/session-requests', adminController.getSessionRequests);
router.post('/session-requests/:id/assign', adminController.assignTherapistToRequest);
router.patch('/session-requests/:id/confirm', adminController.confirmSessionRequest);
router.patch('/session-requests/:id/reject', adminController.rejectSessionRequest);
router.patch('/session-requests/:id/outcome', adminController.updateSessionOutcome);

// ── 5. Decline Review & "Ask Why" Thread ──
router.get('/declines', adminController.getDeclines);
router.get('/declines/:id/thread', adminController.getDeclineThread);
router.post('/declines/:id/ask-why', adminController.postDeclineMessage);
router.post('/declines/:id/resolve', adminController.resolveDecline);

// ── 6. Config Management (Read-only + Editable) ──
router.get('/config', adminController.getConfig);
router.put('/config/blocked-words', adminController.updateBlockedWords);
router.put('/config/helplines', adminController.updateHelplines);

// ── 7. Safety & Reports ──
router.get('/safety-reports', adminController.getSafetyReports);
router.get('/community/reports', adminController.getReportedCommunityPosts);
router.patch('/community/posts/:id/moderate', adminController.moderateCommunityPost);
router.get('/complaints', adminController.getComplaints);
router.patch('/complaints/:id', adminController.updateComplaint);

// ── 8. Super Admin Only Operations ──
router.post('/super/create-admin', requireSuperAdmin, adminController.createAdmin);
router.patch('/super/admins/:id/status', requireSuperAdmin, adminController.updateAdminStatus);
router.post('/super/admins/:id/reset-credentials', requireSuperAdmin, adminController.resetAdminCredentials);

// ── 9. Audit Log Viewers (Append-Only) ──
router.get('/audit-logs', adminController.getAdminAuditLogs);
router.get('/system-audit-logs', adminController.getAdminAuditLogs);
router.get('/consent-audit-logs', adminController.getConsentAuditLogs);

// ── Compatibility Aliases for Phase B & Step 0 Suites ──
router.get('/therapists', adminController.getTherapists);
router.patch('/therapists/:id/verification', adminController.updateTherapistVerification);
router.post('/create-admin', requireSuperAdmin, adminController.createAdmin);
router.post('/users/:id/reset-credentials', requireSuperAdmin, adminController.resetAdminCredentials);

export default router;
