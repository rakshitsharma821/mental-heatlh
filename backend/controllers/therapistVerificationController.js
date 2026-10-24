// ============================================
// MindCare Sanctuary — Therapist Verification & Document Controller
// Part 3: Therapist Profile, Document Submission, Dismissible Progress,
//         and Multi-Stage Verification State Machine
// ============================================

import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { db } from '../models/db.js';
import { CLINICAL_CONFIG } from '../../shared/clinicalConfig.js';
import { clinicalStorage } from '../utils/clinicalStorage.js';

export const therapistVerificationController = {
  /**
   * Retrieves logged-in therapist profile, document summary, and completion progress
   */
  getProfile: async (req, res) => {
    try {
      const therapistId = req.user.id;

      const profileRes = await db.query(`
        SELECT tp.*, u.full_name, u.email, u.mobile_number, u.public_id
        FROM therapist_profiles tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.user_id = $1
      `, [therapistId]);

      if (profileRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Therapist profile not found.' });
      }

      const profile = profileRes.rows[0];

      // Fetch uploaded documents
      const docsRes = await db.query(`
        SELECT id, doc_type, original_filename, file_size, mime_type, status, reject_reason, uploaded_at
        FROM therapist_documents
        WHERE therapist_id = $1
        ORDER BY uploaded_at DESC
      `, [therapistId]);

      const uploadedDocs = docsRes.rows;
      const uploadedDocTypes = new Set(uploadedDocs.map(d => d.doc_type));

      // Calculate missing required documents
      const requiredTypes = Object.values(CLINICAL_CONFIG.documentRules.types)
        .filter(t => t.required)
        .map(t => t.id);

      const missingDocuments = requiredTypes.filter(rt => !uploadedDocTypes.has(rt));

      // Check profile field completeness
      const missingProfileFields = [];
      if (!profile.education_entries || profile.education_entries.length === 0) missingProfileFields.push('Education degrees');
      if (!profile.skills_practised || profile.skills_practised.length === 0) missingProfileFields.push('Therapies practiced');
      if (!profile.specialties || profile.specialties.length === 0) missingProfileFields.push('Clinical specializations');
      if (!profile.bio || profile.bio.length < 20) missingProfileFields.push('Professional bio');
      if (!profile.license_number) missingProfileFields.push('Licence number');
      if (!profile.licensing_board) missingProfileFields.push('Licensing board');

      // Calculate overall progress percentage
      const totalSteps = requiredTypes.length + 3; // docs + education + skills + bio
      let completedSteps = (requiredTypes.length - missingDocuments.length);
      if (profile.education_entries && profile.education_entries.length > 0) completedSteps++;
      if (profile.skills_practised && profile.skills_practised.length > 0) completedSteps++;
      if (profile.bio && profile.bio.length >= 20) completedSteps++;

      const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

      return res.json({
        success: true,
        profile,
        documents: uploadedDocs,
        missingDocuments,
        missingProfileFields,
        completionPercentage,
        isFullySubmitted: missingDocuments.length === 0,
        canSubmitForReview: missingDocuments.length === 0 && profile.verification_status !== 'under_review' && profile.verification_status !== 'approved',
        dpdpNotice: CLINICAL_CONFIG.dpdpPrivacyNotice
      });
    } catch (err) {
      console.error('getProfile error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving therapist profile.' });
    }
  },

  /**
   * Updates therapist profile details
   */
  updateProfile: async (req, res) => {
    try {
      const therapistId = req.user.id;
      const {
        title, gender, city, state, therapist_type, specialties,
        skills_practised, education_entries, years_of_experience,
        languages, consultation_modes, consultation_fee, bio,
        license_number, licensing_board
      } = req.body;

      // Check if critical credentials changed on an already approved therapist
      const currentRes = await db.query('SELECT verification_status, license_number, licensing_board FROM therapist_profiles WHERE user_id = $1', [therapistId]);
      if (currentRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Profile not found.' });
      }

      const current = currentRes.rows[0];
      let newStatus = current.verification_status;

      if (current.verification_status === 'approved') {
        const licenseChanged = license_number && license_number !== current.license_number;
        const boardChanged = licensing_board && licensing_board !== current.licensing_board;
        if (licenseChanged || boardChanged) {
          newStatus = 'under_review'; // Re-triggers admin review
        }
      }

      await db.query(`
        UPDATE therapist_profiles
        SET title = COALESCE($1, title),
            gender = COALESCE($2, gender),
            city = COALESCE($3, city),
            state = COALESCE($4, state),
            therapist_type = COALESCE($5, therapist_type),
            specialties = COALESCE($6::jsonb, specialties),
            skills_practised = COALESCE($7::jsonb, skills_practised),
            education_entries = COALESCE($8::jsonb, education_entries),
            years_of_experience = COALESCE($9, years_of_experience),
            languages = COALESCE($10::jsonb, languages),
            consultation_modes = COALESCE($11::jsonb, consultation_modes),
            consultation_fee = COALESCE($12, consultation_fee),
            bio = COALESCE($13, bio),
            license_number = COALESCE($14, license_number),
            licensing_board = COALESCE($15, licensing_board),
            verification_status = $16
        WHERE user_id = $17
      `, [
        title, gender, city, state, therapist_type,
        specialties ? JSON.stringify(specialties) : null,
        skills_practised ? JSON.stringify(skills_practised) : null,
        education_entries ? JSON.stringify(education_entries) : null,
        years_of_experience ? parseInt(years_of_experience, 10) : null,
        languages ? JSON.stringify(languages) : null,
        consultation_modes ? JSON.stringify(consultation_modes) : null,
        consultation_fee ? parseInt(consultation_fee, 10) : null,
        bio, license_number, licensing_board,
        newStatus, therapistId
      ]);

      return res.json({
        success: true,
        message: newStatus === 'under_review' && current.verification_status === 'approved'
          ? 'Profile updated. Critical credential updates require re-verification.'
          : 'Profile updated successfully.',
        verification_status: newStatus
      });
    } catch (err) {
      console.error('updateProfile error:', err);
      return res.status(500).json({ success: false, message: 'Server error updating therapist profile.' });
    }
  },

  /**
   * Uploads a credential or identity document
   */
  uploadDocument: async (req, res) => {
    try {
      const therapistId = req.user.id;
      const { doc_type, consent_agreed } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      if (!doc_type) {
        return res.status(400).json({ success: false, message: 'doc_type is required.' });
      }

      if (consent_agreed !== 'true' && consent_agreed !== true) {
        return res.status(400).json({
          success: false,
          message: 'You must agree to the genuine credential confirmation and DPDP verification consent.'
        });
      }

      // Save via vault storage service (validates size, extension, magic bytes, malware scan)
      const saved = await clinicalStorage.saveDocument(
        therapistId,
        doc_type,
        file.originalname,
        file.buffer,
        file.mimetype
      );

      const docId = `tdoc_${crypto.randomUUID()}`;

      // Insert metadata into DB (never extracted ID numbers)
      await db.query(`
        INSERT INTO therapist_documents (
          id, therapist_id, doc_type, original_filename, file_size, mime_type, storage_key, status, uploaded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted', CURRENT_TIMESTAMP)
      `, [
        docId, therapistId, saved.docType, saved.originalFilename, saved.fileSize, saved.mimeType, saved.storageKey
      ]);

      // Move status from 'registered' to 'documents_pending' if initial
      await db.query(`
        UPDATE therapist_profiles
        SET verification_status = 'documents_pending'
        WHERE user_id = $1 AND verification_status = 'registered'
      `, [therapistId]);

      return res.status(201).json({
        success: true,
        message: 'Document successfully stored in secure clinical vault.',
        document: {
          id: docId,
          doc_type: saved.docType,
          original_filename: saved.originalFilename,
          file_size: saved.fileSize,
          mime_type: saved.mimeType,
          status: 'submitted'
        }
      });
    } catch (err) {
      console.error('uploadDocument error:', err.message);
      return res.status(400).json({ success: false, message: err.message || 'File upload rejected.' });
    }
  },

  /**
   * Retrieves list of uploaded documents for the therapist
   */
  getDocuments: async (req, res) => {
    try {
      const therapistId = req.user.id;
      const result = await db.query(`
        SELECT id, doc_type, original_filename, file_size, mime_type, status, reject_reason, uploaded_at
        FROM therapist_documents
        WHERE therapist_id = $1
        ORDER BY uploaded_at DESC
      `, [therapistId]);

      return res.json({ success: true, documents: result.rows });
    } catch (err) {
      console.error('getDocuments error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving documents.' });
    }
  },

  /**
   * Deletes a document if not approved or locked
   */
  deleteDocument: async (req, res) => {
    try {
      const therapistId = req.user.id;
      const { docId } = req.params;

      const docRes = await db.query(
        'SELECT storage_key, status FROM therapist_documents WHERE id = $1 AND therapist_id = $2',
        [docId, therapistId]
      );

      if (docRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      if (docRes.rows[0].status === 'approved') {
        return res.status(403).json({ success: false, message: 'Approved documents cannot be deleted.' });
      }

      await clinicalStorage.deleteFile(docRes.rows[0].storage_key);
      await db.query('DELETE FROM therapist_documents WHERE id = $1', [docId]);

      return res.json({ success: true, message: 'Document removed.' });
    } catch (err) {
      console.error('deleteDocument error:', err);
      return res.status(500).json({ success: false, message: 'Server error deleting document.' });
    }
  },

  /**
   * Submits all uploaded credentials for administrative review
   */
  submitForReview: async (req, res) => {
    try {
      const therapistId = req.user.id;

      // Check all required documents are present
      const docsRes = await db.query(
        'SELECT DISTINCT doc_type FROM therapist_documents WHERE therapist_id = $1',
        [therapistId]
      );

      const presentTypes = new Set(docsRes.rows.map(r => r.doc_type));
      const requiredTypes = Object.values(CLINICAL_CONFIG.documentRules.types)
        .filter(t => t.required)
        .map(t => t.id);

      const missing = requiredTypes.filter(rt => !presentTypes.has(rt));
      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'All required documents must be uploaded before submitting for review.',
          missingDocuments: missing
        });
      }

      await db.query(`
        UPDATE therapist_profiles
        SET verification_status = 'under_review'
        WHERE user_id = $1
      `, [therapistId]);

      return res.json({
        success: true,
        message: 'Your verification dossier has been submitted to clinical administration. Review typically takes 24–48 hours.',
        verification_status: 'under_review'
      });
    } catch (err) {
      console.error('submitForReview error:', err);
      return res.status(500).json({ success: false, message: 'Server error submitting verification.' });
    }
  },

  /**
   * Generates a short-lived download token
   */
  getSignedDownloadUrl: async (req, res) => {
    try {
      const { docId } = req.params;
      const user = req.user;

      const docRes = await db.query(
        'SELECT id, therapist_id FROM therapist_documents WHERE id = $1',
        [docId]
      );

      if (docRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      const doc = docRes.rows[0];
      const isOwner = doc.therapist_id === user.id;
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access denied to this document.' });
      }

      const token = clinicalStorage.generateDownloadToken(docId, user.id, user.role);
      return res.json({
        success: true,
        token,
        downloadUrl: `/api/clinical/documents/${docId}/download?token=${encodeURIComponent(token)}`
      });
    } catch (err) {
      console.error('getSignedDownloadUrl error:', err);
      return res.status(500).json({ success: false, message: 'Server error generating signed download token.' });
    }
  },

  /**
   * Streams the document file securely behind authentication and signed token
   */
  downloadDocument: async (req, res) => {
    try {
      const { docId } = req.params;
      const token = req.query.token || req.headers['x-download-token'];

      if (!token) {
        return res.status(401).json({ success: false, message: 'Valid download token required.' });
      }

      const payload = clinicalStorage.verifyDownloadToken(token);
      if (!payload || payload.docId !== docId) {
        return res.status(403).json({ success: false, message: 'Invalid or expired download token.' });
      }

      const docRes = await db.query(
        'SELECT storage_key, mime_type, original_filename FROM therapist_documents WHERE id = $1',
        [docId]
      );

      if (docRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      const doc = docRes.rows[0];
      const filePath = clinicalStorage.getFilePath(doc.storage_key);

      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Document file not found in vault.' });
      }

      res.setHeader('Content-Type', doc.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.original_filename)}"`);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    } catch (err) {
      console.error('downloadDocument error:', err);
      return res.status(500).json({ success: false, message: 'Server error streaming document.' });
    }
  }
};
