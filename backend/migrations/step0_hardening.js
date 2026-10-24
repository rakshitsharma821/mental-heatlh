// ============================================
// MindCare — Step 0 Database Schema Hardening Migration
// ============================================

import crypto from 'crypto';
import { db } from '../models/db.js';

export async function runStep0Migration() {
  console.log('🔄 Running Step 0 Database Migration...');
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Upgrade users table with public_id, status, and role constraint
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS public_id VARCHAR(32) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_access_code BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS access_code_hash TEXT;

      -- Update role constraint if needed
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'therapist', 'admin', 'super_admin'));

      -- Status constraint
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
      ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended', 'deleted'));
    `);

    // Backfill public_id for any user missing one
    const usersWithoutId = await client.query('SELECT id, role FROM users WHERE public_id IS NULL');
    for (const u of usersWithoutId.rows) {
      let prefix = 'MC-';
      if (u.role === 'admin' || u.role === 'super_admin') prefix = 'ADM-';
      else if (u.role === 'therapist') prefix = 'THR-';

      const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const publicId = `${prefix}${randSuffix}`;
      await client.query('UPDATE users SET public_id = $1 WHERE id = $2', [publicId, u.id]);
    }

    // 2. Upgrade therapist_profiles with is_demo, last_seen_at and verification_status state machine
    await client.query(`
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
      
      -- Drop old verification status check if present
      ALTER TABLE therapist_profiles DROP CONSTRAINT IF EXISTS therapist_profiles_verification_status_check;
      
      -- Map legacy 'verified' -> 'approved' and 'pending' -> 'under_review'
      UPDATE therapist_profiles SET verification_status = 'approved' WHERE verification_status = 'verified';
      UPDATE therapist_profiles SET verification_status = 'under_review' WHERE verification_status = 'pending';

      ALTER TABLE therapist_profiles ALTER COLUMN verification_status SET DEFAULT 'under_review';

      ALTER TABLE therapist_profiles ADD CONSTRAINT therapist_profiles_verification_status_check
        CHECK (verification_status IN ('registered', 'documents_pending', 'under_review', 'approved', 'rejected', 'more_info_required', 'suspended'));
    `);

    // 3. Persistent encrypted clinical chat messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical_messages (
        id VARCHAR(64) PRIMARY KEY,
        room_id VARCHAR(100) NOT NULL,
        sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        encrypted_content TEXT NOT NULL,
        iv VARCHAR(64) NOT NULL,
        auth_tag VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_clin_msg_room ON clinical_messages(room_id, created_at ASC);
    `);

    // 4. Clinical therapy plan access logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical_plan_access_logs (
        id VARCHAR(64) PRIMARY KEY,
        plan_id VARCHAR(64) NOT NULL,
        accessor_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        accessor_role VARCHAR(32) NOT NULL,
        action VARCHAR(32) NOT NULL,
        ip_address VARCHAR(50),
        accessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_plan_access_log ON clinical_plan_access_logs(plan_id, accessed_at DESC);
    `);

    // 5. Append-only Admin Audit Log
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id VARCHAR(64) PRIMARY KEY,
        admin_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(80) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(64),
        reason TEXT,
        ip VARCHAR(50),
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_admin_audit_time ON admin_audit_log(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_log(admin_id);
    `);

    // 6. Ensure existing admin@mindcare.com if present is flagged must_change_password
    await client.query(`
      UPDATE users 
      SET must_change_password = TRUE, must_change_access_code = TRUE
      WHERE email = 'admin@mindcare.com'
    `);

    await client.query('COMMIT');
    console.log('✅ Step 0 database migration applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.includes('step0_hardening.js')) {
  runStep0Migration().then(() => process.exit(0)).catch(() => process.exit(1));
}
