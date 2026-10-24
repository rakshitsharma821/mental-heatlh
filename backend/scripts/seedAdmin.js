// ============================================
// MindCare — Idempotent Super Admin Seeder
// Step 0 Phase B: Seed Super Admin with Force-Change on First Login
// ============================================

import crypto from 'crypto';
import dotenv from 'dotenv';
import { db } from '../models/db.js';
import { hashPassword, generateSalt } from '../utils/crypto.js';

dotenv.config();

export async function seedAdmin() {
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ NODE_ENV is "production". Skipping admin auto-seed.');
    return;
  }

  const email = (process.env.ADMIN_EMAIL || 'admin@mindcare.com').toLowerCase().trim();
  const name = process.env.ADMIN_NAME || 'Super Administrator';
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'AdminMindCare@2026!';
  const initialAccessCode = process.env.ADMIN_INITIAL_ACCESS_CODE || 'MC-SUPER-ADM-999';

  console.log(`🔐 Seeding/Verifying Super Admin for [${email}]...`);

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Force must_change_password on any legacy admin@mindcare.com
    await client.query(`
      UPDATE users 
      SET must_change_password = TRUE, must_change_access_code = TRUE
      WHERE email = 'admin@mindcare.com'
    `);

    // 2. Check if the specified super admin exists
    const existing = await client.query('SELECT id, public_id, role FROM users WHERE email = $1', [email]);

    const passwordSalt = generateSalt();
    const passwordHash = hashPassword(initialPassword, passwordSalt);
    const codeSalt = generateSalt();
    const accessCodeHash = `${codeSalt}:${hashPassword(initialAccessCode, codeSalt)}`;

    if (existing.rows.length === 0) {
      const id = 'adm_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const publicId = `ADM-${randSuffix}`;

      const recoveryKeyHash = hashPassword('mindcare-superadmin-recovery', passwordSalt);

      await client.query(`
        INSERT INTO users (
          id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status,
          must_change_password, must_change_access_code, access_code_hash, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'super_admin', 'active', TRUE, TRUE, $8, CURRENT_TIMESTAMP)
      `, [id, publicId, email, passwordHash, passwordSalt, recoveryKeyHash, name, accessCodeHash]);

      console.log(`✅ Super Admin created: ${email} (Public ID: ${publicId})`);
    } else {
      const user = existing.rows[0];
      let publicId = user.public_id;
      if (!publicId) {
        publicId = `ADM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      }

      await client.query(`
        UPDATE users SET
          role = 'super_admin',
          status = 'active',
          public_id = $1,
          must_change_password = TRUE,
          must_change_access_code = TRUE,
          access_code_hash = $2
        WHERE id = $3
      `, [publicId, accessCodeHash, user.id]);

      console.log(`✅ Existing account [${email}] upgraded to super_admin (Public ID: ${publicId}).`);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed super admin:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.includes('seedAdmin.js')) {
  seedAdmin()
    .then(() => {
      console.log('✅ seedAdmin completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
