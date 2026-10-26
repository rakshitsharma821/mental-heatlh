import { db } from '../models/pgDb.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vaultDir = path.resolve(__dirname, '../uploads/clinical_vault');

if (!fs.existsSync(vaultDir)) {
  fs.mkdirSync(vaultDir, { recursive: true });
}

// Minimal valid PDF binary
const samplePdfBytes = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources <<>> /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n198\n%%EOF\n',
  'utf-8'
);

async function setup() {
  console.log('--- Setting up THR-DEMO01 Testing Environment ---');

  // 1. Get Therapist & Client Users
  const thRes = await db.query("SELECT * FROM users WHERE public_id = 'THR-DEMO01' OR email = 'demo.therapist@mindcare.test'");
  const clRes = await db.query("SELECT * FROM users WHERE public_id = 'MC-DEMO01' OR email = 'demo.user@mindcare.test'");

  if (!thRes.rows[0]) throw new Error('THR-DEMO01 user not found!');
  if (!clRes.rows[0]) throw new Error('MC-DEMO01 user not found!');

  const therapist = thRes.rows[0];
  const client = clRes.rows[0];
  const therapistId = therapist.id;
  const clientId = client.id;

  console.log(`Therapist: ${therapist.full_name} (${therapist.public_id})`);
  console.log(`Client: ${client.full_name} (${client.public_id})`);

  // 2. Prepare 4 Required Clinical Verification Documents
  const requiredDocs = [
    {
      doc_type: 'govt_id',
      original_filename: 'Govt_Aadhaar_National_ID.pdf',
      ai_confidence: 98,
      ai_notes: 'AI Check: Valid Government Identity document format verified. Biometric facial markers and government seal authenticated.'
    },
    {
      doc_type: 'degree_certificate',
      original_filename: 'NIMHANS_MSc_Clinical_Psychology.pdf',
      ai_confidence: 99,
      ai_notes: 'AI Check: University Degree Certificate validated. Accreditation watermark and credential legitimacy verified.'
    },
    {
      doc_type: 'licence_certificate',
      original_filename: 'RCI_Clinical_Licence_Registration.pdf',
      ai_confidence: 99,
      ai_notes: 'AI Check: Professional Clinical Licence confirmed. Council registry number matches authorized clinical profile.'
    },
    {
      doc_type: 'photo',
      original_filename: 'Practitioner_Formal_Portrait.pdf',
      ai_confidence: 99,
      ai_notes: 'AI Check: Professional Portrait validated. Clean portrait aspect ratio, high resolution, and compliant clinical background verified.'
    }
  ];

  for (const doc of requiredDocs) {
    const storageKey = `doc_${crypto.randomUUID()}.pdf`;
    const fullPath = path.join(vaultDir, storageKey);
    fs.writeFileSync(fullPath, samplePdfBytes);

    // Remove any existing doc for this type
    await db.query('DELETE FROM therapist_documents WHERE therapist_id = $1 AND doc_type = $2', [therapistId, doc.doc_type]);

    const docId = `tdoc_${crypto.randomUUID()}`;
    await db.query(`
      INSERT INTO therapist_documents (
        id, therapist_id, doc_type, original_filename, file_size, mime_type,
        storage_key, status, uploaded_at, ai_verified, ai_confidence, ai_notes, ai_verified_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'verified', CURRENT_TIMESTAMP, true, $8, $9, CURRENT_TIMESTAMP)
    `, [
      docId,
      therapistId,
      doc.doc_type,
      doc.original_filename,
      samplePdfBytes.length,
      'application/pdf',
      storageKey,
      doc.ai_confidence,
      doc.ai_notes
    ]);

    console.log(`Uploaded & AI-verified: ${doc.doc_type} (${doc.original_filename})`);
  }

  // 3. Update Therapist Profile to Approved & Online
  await db.query(`
    UPDATE therapist_profiles
    SET verification_status = 'approved',
        licence_verified_externally = true,
        external_verification_notes = 'Verified against Rehabilitation Council of India National Registry.',
        profile_completed = true,
        terms_accepted = true,
        is_available = true,
        years_of_experience = 8,
        consultation_fee = 1200,
        title = 'Senior Clinical Psychologist, RCI Licensed',
        bio = 'Specialist in Cognitive Behavioral Therapy (CBT), Dialectical Behavior Therapy (DBT), trauma processing, and somatic mindfulness regulation.',
        specialties = $2::jsonb,
        held_until = null,
        hold_reason = null,
        rejection_reason = null
    WHERE user_id = $1
  `, [
    therapistId,
    JSON.stringify(['Cognitive Behavioral Therapy (CBT)', 'Mindfulness Regulation', 'Anxiety & Trauma Processing', 'Burnout Management'])
  ]);

  console.log('Therapist profile updated to "approved" & available!');

  // 4. Ensure Active Clinical Consent & Pairing Key
  const consentId = `cc_demo_${therapistId.slice(0, 8)}`;
  await db.query(`
    INSERT INTO clinical_consents (id, client_id, therapist_id, status, granted_at, expires_at)
    VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days')
    ON CONFLICT (id) DO UPDATE SET
      status = 'active',
      expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
  `, [consentId, clientId, therapistId]);

  console.log('Active 30-day clinical consent paired with MC-DEMO01!');

  // 5. Ensure Sessions exist: 1 Confirmed (Ready to join WebRTC call) and 1 Assigned (Ready to Accept/Review)
  // Clean old test demo sessions
  await db.query("DELETE FROM session_bookings WHERE therapist_id = $1", [therapistId]);

  const sessionId1 = `sb_active_${crypto.randomUUID().slice(0, 10)}`;
  const sessionId2 = `sb_assigned_${crypto.randomUUID().slice(0, 10)}`;

  // Session 1: Confirmed (Join WebRTC Room button ready immediately)
  await db.query(`
    INSERT INTO session_bookings (
      id, client_id, therapist_id, session_type, mode, slot_duration_minutes,
      preferred_slot, status, consent_share_note, client_encrypted_note, created_at, updated_at
    )
    VALUES (
      $1, $2, $3, 'Live Clinical WebRTC Consultation', 'video', 45,
      CURRENT_TIMESTAMP + INTERVAL '10 minutes', 'confirmed', true,
      '{"ciphertext":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","iv":"123456789012","authTag":"1234567890123456"}',
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `, [sessionId1, clientId, therapistId]);

  // Session 2: Assigned (Accept Session / Propose Time / Intake Report button ready)
  await db.query(`
    INSERT INTO session_bookings (
      id, client_id, therapist_id, session_type, mode, slot_duration_minutes,
      preferred_slot, status, consent_share_note, client_encrypted_note, created_at, updated_at
    )
    VALUES (
      $1, $2, $3, 'Intake & Therapy Evaluation', 'video', 45,
      CURRENT_TIMESTAMP + INTERVAL '1 day', 'assigned', true,
      '{"ciphertext":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","iv":"123456789012","authTag":"1234567890123456"}',
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `, [sessionId2, clientId, therapistId]);

  console.log('Created 2 sessions:');
  console.log(`- Confirmed Session (Join WebRTC Room): ${sessionId1}`);
  console.log(`- Assigned Session (Accept Session / Intake Report): ${sessionId2}`);

  console.log('\nSUCCESS: THR-DEMO01 is fully provisioned, approved, and ready for end-to-end testing!');
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
}).finally(() => process.exit(0));
