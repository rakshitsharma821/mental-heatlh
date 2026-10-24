import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { hashPassword, generateSalt } from '../utils/crypto.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

async function seed(dbName) {
  const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName
  });

  console.log(`\n🌱 Seeding test demo accounts into [${dbName}] on port ${process.env.DB_PORT}...`);

  // Clean old demo records if any exist
  await pool.query(`
    DELETE FROM users
    WHERE email IN ('demo.user@mindcare.test', 'demo.therapist@mindcare.test', 'demo.admin@mindcare.test')
       OR public_id IN ('MC-DEMO01', 'THR-DEMO01', 'ADM-DEMO01')
       OR id IN ('usr_demo_client_01', 'usr_demo_therapist_01', 'usr_demo_admin_01');
  `);

  // 1. Client / User
  const clientSalt = generateSalt();
  const clientPassHash = hashPassword('User@12345', clientSalt);
  const clientRecHash = hashPassword('mindcare-client-rec', clientSalt);
  const clientId = 'usr_demo_client_01';

  await pool.query(`
    INSERT INTO users (
      id, public_id, email, password_hash, salt, recovery_key_hash,
      full_name, role, status, mobile_number, age, gender, address, city, state, streak_count, mindfulness_score
    ) VALUES (
      $1, 'MC-DEMO01', 'demo.user@mindcare.test', $2, $3, $4,
      'Demo User', 'client', 'active', '+919876543201', 22, 'female', '44 Orchid Enclave', 'Jaipur', 'Rajasthan', 3, 25
    );
  `, [clientId, clientPassHash, clientSalt, clientRecHash]);

  // Roadmap & digital twin for client
  await pool.query(`
    INSERT INTO therapy_roadmaps (id, user_id, active_track, milestones_json, current_stage_index, progress_percentage)
    VALUES ($1, $2, 'Mindful Foundations', '[]', 0, 15)
    ON CONFLICT (user_id) DO NOTHING;
  `, [crypto.randomUUID(), clientId]);

  await pool.query(`
    INSERT INTO digital_twin_profiles (id, user_id, stress_index, resilience_buffer, emotional_velocity)
    VALUES ($1, $2, 30, 70, 0.0)
    ON CONFLICT (user_id) DO NOTHING;
  `, [crypto.randomUUID(), clientId]);

  await pool.query(`
    INSERT INTO inner_world_states (id, user_id, tree_growth_stage, foliage_density, ambient_weather, firefly_warmth)
    VALUES ($1, $2, 0.35, 0.45, 'golden_hour', 0.70)
    ON CONFLICT (user_id) DO NOTHING;
  `, [crypto.randomUUID(), clientId]);

  console.log('✅ Client created: MC-DEMO01 / demo.user@mindcare.test (Password: User@12345)');

  // 2. Therapist
  const thSalt = generateSalt();
  const thPassHash = hashPassword('Therapist@12345', thSalt);
  const thRecHash = hashPassword('mindcare-th-rec', thSalt);
  const therapistId = 'usr_demo_therapist_01';

  await pool.query(`
    INSERT INTO users (
      id, public_id, email, password_hash, salt, recovery_key_hash,
      full_name, role, status, mobile_number, age, gender, address, city, state
    ) VALUES (
      $1, 'THR-DEMO01', 'demo.therapist@mindcare.test', $2, $3, $4,
      'Dr. Evelyn Vance, PsyD', 'therapist', 'active', '+919876543202', 25, 'Female', 'Clinical Suite 4', 'Bengaluru', 'Karnataka'
    );
  `, [therapistId, thPassHash, thSalt, thRecHash]);

  await pool.query(`
    INSERT INTO therapist_profiles (
      id, user_id, license_number, licensing_board, specialties, bio,
      is_available, title, verification_status, is_demo
    ) VALUES (
      'tp_demo_therapist_01', $1, 'RCI-PSY-DEMO01', 'Rehabilitation Council of India',
      '["Cognitive Behavioral Therapy (CBT)", "Mindfulness Regulation", "Burnout Management"]'::jsonb,
      'Dedicated clinical psychologist focusing on cognitive behavioral therapy and nervous system grounding.',
      TRUE, 'Senior Clinical Psychologist', 'approved', FALSE
    )
    ON CONFLICT (user_id) DO UPDATE SET
      verification_status = 'approved',
      is_available = TRUE,
      is_demo = FALSE;
  `, [therapistId]);

  console.log('✅ Therapist created: THR-DEMO01 / demo.therapist@mindcare.test (Password: Therapist@12345)');

  // 3. Admin
  const admSalt = generateSalt();
  const admPassHash = hashPassword('Admin@12345', admSalt);
  const admRecHash = hashPassword('mindcare-adm-rec', admSalt);
  const codeSalt = generateSalt();
  const codeHash = hashPassword('ADM-CODE-DEMO1', codeSalt);
  const accessCodeCombined = `${codeSalt}:${codeHash}`;
  const adminId = 'usr_demo_admin_01';

  await pool.query(`
    INSERT INTO users (
      id, public_id, email, password_hash, salt, recovery_key_hash,
      full_name, role, status, must_change_password, must_change_access_code, access_code_hash
    ) VALUES (
      $1, 'ADM-DEMO01', 'demo.admin@mindcare.test', $2, $3, $4,
      'Demo Administrator', 'admin', 'active', FALSE, FALSE, $5
    );
  `, [adminId, admPassHash, admSalt, admRecHash, accessCodeCombined]);

  console.log('✅ Admin created: ADM-DEMO01 (Code: ADM-CODE-DEMO1, Password: Admin@12345)');

  await pool.end();
}

async function main() {
  await seed('mindcare_db');
  await seed('mindcare_test');
  console.log('\n🎉 ALL DEMO ACCOUNTS READY IN BOTH DATABASES!');
}

main().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
