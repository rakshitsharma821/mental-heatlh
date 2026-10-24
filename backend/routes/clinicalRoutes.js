// ============================================
// MindCare Backend — Clinical Routes
// Task 6, Step 0 & Part 3: Professional Connect, WebRTC, Availability,
//                         Therapist Profile & Document Verification
// ============================================

import express from 'express';
import multer from 'multer';
import { clinicalController } from '../controllers/clinicalController.js';
import { therapistVerificationController } from '../controllers/therapistVerificationController.js';
import { authenticateToken, requireTherapist, requireRole, requireAnyTherapist } from '../middleware/auth.js';
import { CLINICAL_CONFIG } from '../../shared/clinicalConfig.js';

const router = express.Router();

// Multer memory storage with 5MB limit for credential uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: CLINICAL_CONFIG.documentRules.maxFileSizeBytes
  }
});

// Public / General clinical routes
// Public clinician endpoints removed - therapists listed ONLY to authenticated clients
router.get('/therapist', (req, res) => res.status(404).json({ success: false, message: 'Endpoint not found' }));
router.get('/therapists', (req, res) => res.status(404).json({ success: false, message: 'Endpoint not found' }));
router.get('/availability', clinicalController.getAvailability);
router.get('/directory', authenticateToken, clinicalController.getDirectory);
router.get('/therapists/:therapistId/availability', authenticateToken, clinicalController.getTherapistAvailability);
router.get('/rtc-config', clinicalController.getRtcConfig);
router.post('/book', clinicalController.submitBooking);

// Part 5: Therapist Availability Management
router.get('/availability/my-schedule', authenticateToken, requireTherapist, clinicalController.getMySchedule);
router.put('/availability/my-schedule', authenticateToken, requireTherapist, clinicalController.updateMySchedule);
router.post('/availability/heartbeat', authenticateToken, requireTherapist, clinicalController.heartbeat);

// Part 5: Session Request Pipeline (Client Facing)
router.post('/session-requests', authenticateToken, clinicalController.createSessionRequest);
router.get('/my-sessions', authenticateToken, clinicalController.getMySessions);
router.patch('/session-requests/:id/cancel', authenticateToken, clinicalController.cancelSession);
router.get('/session-requests/:id/history', authenticateToken, clinicalController.getSessionStateHistory);

// Part 5: Session Request Management (Therapist Facing)
router.get('/therapist/sessions', authenticateToken, requireTherapist, clinicalController.getTherapistSessions);
router.patch('/session-requests/:id/therapist-action', authenticateToken, requireTherapist, clinicalController.therapistSessionAction);

// Gated Session Requests (Approved Therapists / Admins only)
router.get('/requests', authenticateToken, requireTherapist, clinicalController.getRequests);
router.patch('/requests/:id', authenticateToken, requireTherapist, clinicalController.updateRequestStatus);

// Role-based clinical routes (Approved Psychologists / Psychiatrists / Admin only)
router.post('/availability/toggle', authenticateToken, requireTherapist, clinicalController.toggleAvailability);
router.post('/treatment-plan', authenticateToken, requireTherapist, clinicalController.saveTreatmentPlan);
router.patch('/evaluation/:clientId', authenticateToken, requireTherapist, clinicalController.updateEvaluation);
router.post('/verify-consent-key', authenticateToken, requireTherapist, clinicalController.verifyConsentKey);

// Client-viewable treatment plan (client sees own, therapist sees assigned)
router.get('/treatment-plan/:clientId', authenticateToken, clinicalController.getTreatmentPlan);

// Persistent encrypted clinical chat (client + assigned therapist only, never admin)
router.get('/messages/:roomId', authenticateToken, clinicalController.getClinicalMessages);
router.post('/messages', authenticateToken, clinicalController.sendClinicalMessage);

// Part 3: Therapist Profile, Document Submission & State Machine Routes
router.get('/profile', authenticateToken, requireAnyTherapist, therapistVerificationController.getProfile);
router.put('/profile', authenticateToken, requireAnyTherapist, therapistVerificationController.updateProfile);
router.get('/documents', authenticateToken, requireAnyTherapist, therapistVerificationController.getDocuments);
router.post('/documents/upload', authenticateToken, requireAnyTherapist, upload.single('file'), therapistVerificationController.uploadDocument);
router.delete('/documents/:docId', authenticateToken, requireAnyTherapist, therapistVerificationController.deleteDocument);
router.post('/documents/submit-for-review', authenticateToken, requireAnyTherapist, therapistVerificationController.submitForReview);
router.get('/documents/:docId/signed-url', authenticateToken, therapistVerificationController.getSignedDownloadUrl);
router.get('/documents/:docId/download', therapistVerificationController.downloadDocument);

export default router;
