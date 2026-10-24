// ============================================
// MindCare Sanctuary — One-off Dev DB Cleanup Script
// Removes test-created users, therapists, and sessions from mindcare_db
// Preserves real accounts and canonical demo accounts
// Displays before/after counts of therapist_profiles
// ============================================

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const { Pool } = pg;

async function cleanDevDatabase() {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  for (const r of required) {
    if (!process.env[r]) throw new Error(`Missing required database configuration environment variable: ${r}`);
  }

  const targetDb = process.env.DB_NAME;
  console.log(`\n🧹 Starting Dev Database Cleanup on [${targetDb}] on port ${process.env.DB_PORT}...`);

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: targetDb,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 5000
  });

  const client = await pool.connect();

  try {
    // 1. Before Counts
    const beforeTherapistsRes = await client.query('SELECT count(*) FROM therapist_profiles');
    const beforeTherapistsCount = parseInt(beforeTherapistsRes.rows[0].count, 10);

    const beforeUsersRes = await client.query('SELECT count(*) FROM users');
    const beforeUsersCount = parseInt(beforeUsersRes.rows[0].count, 10);

    console.log(`\n📊 BEFORE CLEANUP:`);
    console.log(`   - Total Users: ${beforeUsersCount}`);
    console.log(`   - Total Therapist Profiles: ${beforeTherapistsCount}`);

    // 2. Identify Test Users
    const testUsersQuery = `
      SELECT id, email, full_name, role FROM users
      WHERE (
        (email LIKE '%.test' AND email NOT IN ('demo.user@mindcare.test', 'demo.therapist@mindcare.test', 'demo.admin@mindcare.test'))
        OR (email LIKE '%@clinic.test')
        OR (email LIKE '%@mindcare.test' AND email NOT IN ('demo.user@mindcare.test', 'demo.therapist@mindcare.test', 'demo.admin@mindcare.test'))
        OR id LIKE 'usr_p%'
        OR id LIKE 'th-p%'
        OR id LIKE 'adm-p%'
        OR id LIKE 'usr_auth_%'
        OR id LIKE 'th_step0_%'
        OR (id LIKE 'th_%' AND id != 'th_demo_therapist_01')
        OR full_name IN (
          'Dr. Evelyn Cross', 'Dr. Facilitator', 'Dr. Quiet', 'Dr. Unassigned',
          'Dr. Part 5 Clinician', 'Dr. Verified Clinician', 'Part 5 Client',
          'Part 5 Admin', 'Other Client', 'Dr. Part 6 Therapist', 'Dr. Demo Sample'
        )
      )
    `;

    const testUsersRes = await client.query(testUsersQuery);
    const testUserIds = testUsersRes.rows.map(u => u.id);
    console.log(`\n🔍 Identified ${testUserIds.length} test-created user accounts to remove.`);

    if (testUserIds.length === 0) {
      console.log('✨ No test accounts detected in dev DB. Already clean!');
      return;
    }

    await client.query('BEGIN');

    const safeDelete = async (tableName, sql, params) => {
      const reg = await client.query("SELECT to_regclass($1) as reg", ['public.' + tableName]);
      if (reg.rows[0].reg) {
        const res = await client.query(sql, params);
        return res.rowCount;
      }
      return 0;
    };

    const deletedCounts = {};

    deletedCounts.clinical_plan_access_logs = await safeDelete('clinical_plan_access_logs', `
      DELETE FROM clinical_plan_access_logs WHERE accessor_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.clinical_treatment_plans = await safeDelete('clinical_treatment_plans', `
      DELETE FROM clinical_treatment_plans WHERE client_id = ANY($1) OR therapist_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.clinical_notes = await safeDelete('clinical_notes', `
      DELETE FROM clinical_notes WHERE client_id = ANY($1) OR therapist_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.clinical_messages = await safeDelete('clinical_messages', `
      DELETE FROM clinical_messages WHERE sender_id = ANY($1) OR recipient_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.session_state_history = await safeDelete('session_state_history', `
      DELETE FROM session_state_history
      WHERE session_id IN (
        SELECT id FROM session_bookings WHERE client_id = ANY($1) OR therapist_id = ANY($1)
      ) OR changed_by = ANY($1)
    `, [testUserIds]);

    deletedCounts.session_declines = await safeDelete('session_declines', `
      DELETE FROM session_declines
      WHERE session_id IN (
        SELECT id FROM session_bookings WHERE client_id = ANY($1) OR therapist_id = ANY($1)
      ) OR therapist_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.session_bookings = await safeDelete('session_bookings', `
      DELETE FROM session_bookings WHERE client_id = ANY($1) OR therapist_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.therapist_availability = await safeDelete('therapist_availability', `
      DELETE FROM therapist_availability WHERE therapist_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.therapist_documents = await safeDelete('therapist_documents', `
      DELETE FROM therapist_documents WHERE therapist_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.therapist_profiles = await safeDelete('therapist_profiles', `
      DELETE FROM therapist_profiles WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.notifications = await safeDelete('notifications', `
      DELETE FROM notifications WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.community_reports = await safeDelete('community_reports', `
      DELETE FROM community_reports WHERE reporter_user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.community_comments = await safeDelete('community_comments', `
      DELETE FROM community_comments WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.community_posts = await safeDelete('community_posts', `
      DELETE FROM community_posts WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.mood_logs = await safeDelete('mood_logs', `
      DELETE FROM mood_logs WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.consent_audit_logs = await safeDelete('consent_audit_logs', `
      DELETE FROM consent_audit_logs WHERE accessor_therapist_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.admin_audit_log = await safeDelete('admin_audit_log', `
      DELETE FROM admin_audit_log WHERE admin_id = ANY($1) OR target_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.user_otps = await safeDelete('user_otps', `
      DELETE FROM user_otps WHERE identifier IN (
        SELECT email FROM users WHERE id = ANY($1)
      )
    `, [testUserIds]);

    await safeDelete('system_configs', `
      UPDATE system_configs SET updated_by = NULL WHERE updated_by = ANY($1)
    `, [testUserIds]);

    deletedCounts.companion_memories = await safeDelete('companion_memories', `
      DELETE FROM companion_memories WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.companion_user_words = await safeDelete('companion_user_words', `
      DELETE FROM companion_user_words WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.journal_entries = await safeDelete('journal_entries', `
      DELETE FROM journal_entries WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.activity_logs = await safeDelete('activity_logs', `
      DELETE FROM activity_logs WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.therapy_roadmaps = await safeDelete('therapy_roadmaps', `
      DELETE FROM therapy_roadmaps WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.user_assessments = await safeDelete('user_assessments', `
      DELETE FROM user_assessments WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.digital_twin_profiles = await safeDelete('digital_twin_profiles', `
      DELETE FROM digital_twin_profiles WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.mood_predictions = await safeDelete('mood_predictions', `
      DELETE FROM mood_predictions WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.notification_preferences = await safeDelete('notification_preferences', `
      DELETE FROM notification_preferences WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.notification_consent_audit = await safeDelete('notification_consent_audit', `
      DELETE FROM notification_consent_audit WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.in_app_notifications = await safeDelete('in_app_notifications', `
      DELETE FROM in_app_notifications WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.user_focus_sessions = await safeDelete('user_focus_sessions', `
      DELETE FROM user_focus_sessions WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.queued_notifications = await safeDelete('queued_notifications', `
      DELETE FROM queued_notifications WHERE user_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.peer_matches = await safeDelete('peer_matches', `
      DELETE FROM peer_matches WHERE user_a_id = ANY($1) OR user_b_id = ANY($1)
    `, [testUserIds]);

    deletedCounts.users = await safeDelete('users', `
      DELETE FROM users WHERE id = ANY($1)
    `, [testUserIds]);

    await client.query('COMMIT');

    console.log(`\n🗑️ ROWS REMOVED FROM DEV DB:`);
    for (const [table, count] of Object.entries(deletedCounts)) {
      if (count > 0) {
        console.log(`   - ${table.padEnd(28)}: ${count} rows deleted`);
      }
    }

    // 4. After Counts
    const afterTherapistsRes = await client.query('SELECT count(*) FROM therapist_profiles');
    const afterTherapistsCount = parseInt(afterTherapistsRes.rows[0].count, 10);

    const afterUsersRes = await client.query('SELECT count(*) FROM users');
    const afterUsersCount = parseInt(afterUsersRes.rows[0].count, 10);

    console.log(`\n📊 AFTER CLEANUP:`);
    console.log(`   - Total Users: ${afterUsersCount} (was ${beforeUsersCount}, removed ${beforeUsersCount - afterUsersCount})`);
    console.log(`   - Total Therapist Profiles: ${afterTherapistsCount} (was ${beforeTherapistsCount}, removed ${beforeTherapistsCount - afterTherapistsCount})`);

    // List remaining therapists
    const remainingTherapistsRes = await client.query(`
      SELECT u.id, u.email, u.full_name, u.role, tp.title, tp.verification_status, tp.license_number
      FROM users u
      JOIN therapist_profiles tp ON u.id = tp.user_id
    `);
    console.log(`\n🩺 REMAINING THERAPIST PROFILES IN DEV DB (${remainingTherapistsRes.rows.length}):`);
    for (const t of remainingTherapistsRes.rows) {
      console.log(`   • [${t.verification_status}] ${t.full_name} (${t.email}) - License: ${t.license_number}`);
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed, transaction rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDevDatabase().catch(() => process.exit(1));
