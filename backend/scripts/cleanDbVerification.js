// ============================================
// MindCare Sanctuary — Clean Database Verification Script
// ============================================

import { initPostgresDatabase, db } from '../models/db.js';
import { seedAdmin } from './seedAdmin.js';

async function run() {
  console.log(`\n🐘 Running Clean DB Verification against DB: [${process.env.DB_NAME}]...`);
  await initPostgresDatabase();
  await seedAdmin();

  const countRes = await db.query("SELECT count(*) as total FROM information_schema.tables WHERE table_schema='public'");
  console.log(`✅ All ${countRes.rows[0].total} PostgreSQL tables initialized successfully.`);

  const adminRes = await db.query("SELECT email, role, public_id FROM users WHERE role = 'admin' OR role = 'super_admin'");
  console.log('✅ Seeded admin account in fresh database:', adminRes.rows);

  process.exit(0);
}

run().catch(err => {
  console.error('Clean DB check error:', err);
  process.exit(1);
});
