// ============================================
// MindCare Sanctuary — Demo Accounts Seeder
// Seeds 3 pre-configured demo accounts into PostgreSQL:
// 1. Client (Normal User): MC-DEMO01 | demo.user@mindcare.test | User@12345
// 2. Therapist (Approved): THR-DEMO01 | demo.therapist@mindcare.test | Therapist@12345
// 3. Admin: ADM-DEMO01 | demo.admin@mindcare.test | Admin@12345 | Access Code: ADM-CODE-DEMO1
// ============================================

import { db, initPostgresDatabase } from '../models/db.js';
import { hashPassword, generateSalt } from '../utils/crypto.js';

export async function seedDemoAccounts() {
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ NODE_ENV is "production". Skipping demo accounts seed.');
    return;
  }

  await initPostgresDatabase();

  // 1. Demo Client Account
  const clientUid = 'usr_demo_client_01';
  const clientPublicId = 'MC-DEMO01';
  const clientEmail = 'demo.user@mindcare.test';
  const clientPassword = 'User@12345';
  const clientSalt = generateSalt();
  const clientHash = hashPassword(clientPassword, clientSalt);
  const clientRec = hashPassword('mindcare-client-demo-rec', clientSalt);

  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status, age, gender, city, state)
    VALUES ($1, $2, $3, $4, $5, $6, 'Aarav Mehta', 'client', 'active', 22, 'Male', 'New Delhi', 'Delhi')
    ON CONFLICT (id) DO UPDATE SET
      public_id = $2,
      email = $3,
      password_hash = $4,
      salt = $5,
      recovery_key_hash = $6,
      status = 'active',
      age = 22;
  `, [clientUid, clientPublicId, clientEmail, clientHash, clientSalt, clientRec]);

  // Also ensure user can be found by email on conflict
  await db.query(`
    UPDATE users SET password_hash = $1, salt = $2, public_id = $3, status = 'active'
    WHERE email = $4;
  `, [clientHash, clientSalt, clientPublicId, clientEmail]);

  // 2. Demo Therapist Account (Approved & Available)
  const therapistUid = 'th_demo_therapist_01';
  const therapistPublicId = 'THR-DEMO01';
  const therapistEmail = 'demo.therapist@mindcare.test';
  const therapistPassword = 'Therapist@12345';
  const therapistSalt = generateSalt();
  const therapistHash = hashPassword(therapistPassword, therapistSalt);
  const therapistRec = hashPassword('mindcare-therapist-demo-rec', therapistSalt);

  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status, age, gender, city, state)
    VALUES ($1, $2, $3, $4, $5, $6, 'Dr. Ananya Roy, PhD', 'therapist', 'active', 36, 'Female', 'Bengaluru', 'Karnataka')
    ON CONFLICT (id) DO UPDATE SET
      public_id = $2,
      email = $3,
      password_hash = $4,
      salt = $5,
      recovery_key_hash = $6,
      status = 'active';
  `, [therapistUid, therapistPublicId, therapistEmail, therapistHash, therapistSalt, therapistRec]);

  await db.query(`
    UPDATE users SET password_hash = $1, salt = $2, public_id = $3, status = 'active'
    WHERE email = $4;
  `, [therapistHash, therapistSalt, therapistPublicId, therapistEmail]);

  await db.query(`
    INSERT INTO therapist_profiles (
      id, user_id, license_number, licensing_board, specialties, skills_practised,
      years_of_experience, title, verification_status, is_demo, is_available, bio,
      city, state, therapist_type, profile_completed
    ) VALUES (
      'tp_demo_therapist_01', $1, 'RCI-CR-2024-8891', 'Rehabilitation Council of India (RCI)',
      '["Anxiety & Panic", "Depression & Mood", "Academic & Work Stress"]'::jsonb,
      '["Cognitive Behavioral Therapy (CBT)", "Mindfulness-Based Stress Reduction (MBSR)"]'::jsonb,
      8, 'Licensed Clinical Psychologist', 'under_review', TRUE, FALSE,
      'Senior Clinical Psychologist dedicated to gentle somatic grounding, young adult transitions, and cognitive resilience.',
      'Bengaluru', 'Karnataka', 'Clinical Psychologist', TRUE
    )
    ON CONFLICT (user_id) DO UPDATE SET
      verification_status = 'under_review',
      is_demo = TRUE,
      is_available = FALSE,
      license_number = 'RCI-CR-2024-8891',
      licensing_board = 'Rehabilitation Council of India (RCI)';
  `, [therapistUid]);

  // 3. Demo Admin Account
  const adminUid = 'adm_demo_admin_01';
  const adminPublicId = 'ADM-DEMO01';
  const adminEmail = 'demo.admin@mindcare.test';
  const adminPassword = 'Admin@12345';
  const adminAccessCode = 'ADM-CODE-DEMO1';
  const adminSalt = generateSalt();
  const adminHash = hashPassword(adminPassword, adminSalt);
  const codeSalt = generateSalt();
  const accessCodeHash = `${codeSalt}:${hashPassword(adminAccessCode, codeSalt)}`;
  const adminRec = hashPassword('mindcare-admin-demo-rec', adminSalt);

  await db.query(`
    INSERT INTO users (
      id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status,
      must_change_password, must_change_access_code, access_code_hash, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, 'Devendra Verma (Admin)', 'admin', 'active',
      FALSE, FALSE, $7, CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      public_id = $2,
      email = $3,
      password_hash = $4,
      salt = $5,
      access_code_hash = $7,
      must_change_password = FALSE,
      must_change_access_code = FALSE,
      status = 'active';
  `, [adminUid, adminPublicId, adminEmail, adminHash, adminSalt, adminRec, accessCodeHash]);

  await db.query(`
    UPDATE users SET password_hash = $1, salt = $2, access_code_hash = $3, public_id = $4, status = 'active'
    WHERE email = $5;
  `, [adminHash, adminSalt, accessCodeHash, adminPublicId, adminEmail]);

  console.log('✅ Demo accounts successfully seeded into PostgreSQL database.');
}

// Auto-run if executed directly via node
if (process.argv[1]?.endsWith('seedDemoAccounts.js')) {
  seedDemoAccounts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
