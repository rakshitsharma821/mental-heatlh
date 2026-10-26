// Migration script for AI document verification and admin hold/pause columns
import { db } from '../models/db.js';

async function migrate() {
  try {
    console.log('Applying AI verification and admin hold migrations...');
    await db.query(`
      ALTER TABLE therapist_documents 
      ADD COLUMN IF NOT EXISTS ai_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS ai_confidence INTEGER DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS ai_notes TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS ai_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    `);

    await db.query(`
      ALTER TABLE therapist_profiles
      ADD COLUMN IF NOT EXISTS held_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS hold_reason TEXT DEFAULT NULL;
    `);

    await db.query(`
      ALTER TABLE therapist_profiles DROP CONSTRAINT IF EXISTS therapist_profiles_verification_status_check;
      ALTER TABLE therapist_profiles ADD CONSTRAINT therapist_profiles_verification_status_check 
        CHECK (verification_status IN ('registered', 'documents_pending', 'under_review', 'approved', 'rejected', 'more_info_required', 'suspended', 'held'));
    `);

    console.log('✅ Schema successfully updated with AI verification and hold columns.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
