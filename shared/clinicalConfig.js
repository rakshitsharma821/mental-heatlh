// ============================================
// MindCare Sanctuary — Clinical & Therapist Configuration
// Single source of truth for:
// - Specializations & clinical therapy modalities
// - Therapist credential categories & licensing bodies
// - Document verification requirements, MIME rules, size limits
// - Verification state machine & retention policy
// ============================================

export const CLINICAL_CONFIG = {
  therapistTypes: [
    'Clinical Psychologist',
    'Psychiatrist',
    'Counselling Psychologist',
    'Licensed Therapist / Counsellor'
  ],

  specializations: [
    'Anxiety & Panic',
    'Depression & Mood',
    'Relationship & Family',
    'Work & Academic Stress',
    'Trauma & PTSD',
    'Sleep Restoration',
    'Self-Esteem & Identity',
    'Grief & Loss'
  ],

  skillsTherapies: [
    'Cognitive Behavioral Therapy (CBT)',
    'Mindfulness-Based Stress Reduction (MBSR)',
    'Acceptance and Commitment Therapy (ACT)',
    'Dialectical Behavior Therapy (DBT)',
    'Psychodynamic Therapy',
    'Interpersonal Therapy (IPT)',
    'Somatic Experiencing',
    'Solution-Focused Brief Therapy (SFBT)'
  ],

  consultationModes: ['chat', 'voice', 'video'],

  licensingBodies: [
    'Rehabilitation Council of India (RCI)',
    'National Medical Commission (NMC)',
    'State Medical Council',
    'Indian Association of Clinical Psychologists (IACP)',
    'Other Statutory Council'
  ],

  verificationStates: {
    REGISTERED: 'registered',
    DOCUMENTS_PENDING: 'documents_pending',
    UNDER_REVIEW: 'under_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    MORE_INFO_REQUIRED: 'more_info_required',
    SUSPENDED: 'suspended'
  },

  documentRules: {
    maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB
    maxFileSizeMB: 5,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    magicBytes: {
      pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    },
    types: {
      govt_id: {
        id: 'govt_id',
        title: 'Government Photo ID',
        description: 'Aadhaar (masked except last 4 digits), Passport, Voter ID or Driving Licence',
        required: true
      },
      degree_certificate: {
        id: 'degree_certificate',
        title: 'Highest Degree Certificate & Marksheet',
        description: 'M.Phil / Ph.D / M.D. / M.Sc. certificate matching education entries',
        required: true
      },
      licence_certificate: {
        id: 'licence_certificate',
        title: 'Professional Registration / Licence Proof',
        description: 'Registration certificate from RCI, NMC or relevant State Council',
        required: true
      },
      photo: {
        id: 'photo',
        title: 'Recent Professional Portrait / Selfie',
        description: 'Clear frontal photo with clean background',
        required: true
      },
      experience_proof: {
        id: 'experience_proof',
        title: 'Experience Proof / Clinical Affiliation',
        description: 'Letter of appointment or experience certificate (Optional)',
        required: false
      },
      address_proof: {
        id: 'address_proof',
        title: 'Address Verification Proof',
        description: 'Utility bill, bank statement, or registered lease (Optional)',
        required: false
      },
      extra_certification: {
        id: 'extra_certification',
        title: 'Specialized Additional Certifications',
        description: 'CBT, EMDR, Somatic, or specialized therapy credentials (Optional)',
        required: false
      }
    }
  },

  consentNotice: 'I confirm that all uploaded documents and submitted credentials are authentic and accurate. I explicitly consent to their confidential verification, secure encrypted storage, and professional compliance auditing under applicable data protection norms.',

  dpdpPrivacyNotice: 'Under the Digital Personal Data Protection Act (DPDP) and clinical governance standards, your credential documents are stored in an encrypted, non-public vault accessible exclusively by authorized clinical verifiers and administrators. Document metadata is retained for compliance auditing, and access tokens are strictly time-limited.',

  retentionPolicy: {
    activeClinicianRetention: 'Retained for active clinical tenure',
    auditLogRetentionDays: 1825 // 5 years statutory audit
  },

  // Part 5: Decline Reasons, Session Config & State Machine Definitions
  declineReasons: [
    { id: 'schedule_conflict', label: 'Schedule Conflict / Overbooked' },
    { id: 'out_of_specialization', label: 'Case Out of Clinical Specialization' },
    { id: 'capacity_limit', label: 'Current Clinical Caseload at Full Capacity' },
    { id: 'personal_leave', label: 'On Leave / Time Off' },
    { id: 'other', label: 'Other Clinical or Operational Reason' }
  ],

  sessionConfig: {
    defaultSlotDuration: 45, // minutes
    allowedDurations: [30, 45, 60],
    defaultBufferMinutes: 10,
    gracePeriodMinutes: 15, // room accessible 15m before & after slot
    defaultTimezone: 'Asia/Kolkata'
  },

  sessionStates: {
    REQUESTED: 'requested',
    UNDER_ADMIN_REVIEW: 'under_admin_review',
    ASSIGNED: 'assigned',
    THERAPIST_ACCEPTED: 'therapist_accepted',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    ADMIN_REJECTED: 'admin_rejected',
    THERAPIST_DECLINED: 'therapist_declined',
    ADMIN_FOLLOW_UP: 'admin_follow_up',
    CANCELLED_BY_USER: 'cancelled_by_user',
    EXPIRED: 'expired'
  }
};
