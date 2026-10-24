import fs from 'fs';

let c = fs.readFileSync('backend/models/pgDb.js', 'utf8');

const migrationSql = `
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS title VARCHAR(150) DEFAULT 'Licensed Clinical Psychologist';

      CREATE TABLE IF NOT EXISTS clinical_therapy_plans (
        id VARCHAR(64) PRIMARY KEY,
        client_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        therapist_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        therapist_name VARCHAR(150),
        requires_further_evaluation BOOLEAN DEFAULT FALSE,
        clinical_notes TEXT,
        evaluation_summary TEXT,
        collaborative_therapies JSONB DEFAULT '[]',
        goals JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_therapy_plans_client ON clinical_therapy_plans(client_id);
      CREATE INDEX IF NOT EXISTS idx_therapy_plans_therapist ON clinical_therapy_plans(therapist_id);
`;

const seedTherapistCode = `
    // Seed default licensed therapist
    const therapistUserRes = await client.query("SELECT id FROM users WHERE id = 'th_sarah_vance' OR email = 'sarah.vance@mindcare.com'");
    if (therapistUserRes.rows.length === 0) {
      await client.query(\`
        INSERT INTO users (id, email, password_hash, salt, recovery_key_hash, full_name, role, mobile_number, age, gender)
        VALUES ('th_sarah_vance', 'sarah.vance@mindcare.com', 'scrypt_demo_hash', 'salt', 'rec_key', 'Dr. Sarah Vance, PsyD', 'therapist', '+919876543210', 25, 'Female')
        ON CONFLICT (id) DO NOTHING;
      \`);
    }
    await client.query(\`
      INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, specialties, bio, is_available, title, verification_status)
      VALUES (
        'tp_sarah_vance',
        'th_sarah_vance',
        'Lic #PSY-28491',
        'California Board of Psychology / RCI India',
        '["Cognitive Behavioral Therapy (CBT)", "Mindfulness Regulation", "Burnout and Anxiety Management"]'::jsonb,
        'Specializing in integrative mindfulness-based cognitive therapy, nervous system down-regulation, and compassionate burnout recovery.',
        TRUE,
        'Licensed Clinical Psychologist',
        'verified'
      )
      ON CONFLICT (user_id) DO UPDATE SET is_available = EXCLUDED.is_available;
    \`);
`;

if (!c.includes('clinical_therapy_plans')) {
  c = c.replace(
    'CREATE INDEX IF NOT EXISTS idx_multimodal_user ON multimodal_metrics(user_id, source_type, ingested_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_multimodal_user ON multimodal_metrics(user_id, source_type, ingested_at DESC);\n' + migrationSql
  );
  c = c.replace('await client.query(\'COMMIT\');', seedTherapistCode + '\n    await client.query(\'COMMIT\');');
  fs.writeFileSync('backend/models/pgDb.js', c);
  console.log('Successfully updated backend/models/pgDb.js with Task 6 schema & therapist seed');
} else {
  console.log('clinical_therapy_plans already present in pgDb.js');
}
