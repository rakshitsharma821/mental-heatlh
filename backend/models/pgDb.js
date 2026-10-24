// ============================================
// MindCare Sanctuary — PostgreSQL Database Engine & Schema Migrator
// Connects to PostgreSQL 18 on port 5432 with full ACID constraints & JSONB support
// ============================================

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5433,
  database: process.env.DB_NAME || 'mindcare_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Helper for unified query execution
export const db = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
};

export async function initPostgresDatabase() {
  const client = await pool.connect();
  try {
    console.log(`🐘 Connecting to PostgreSQL [${process.env.DB_NAME || 'mindcare_db'}] on port ${process.env.DB_PORT || 5433}...`);

    await client.query('BEGIN');

    // 1. Phase 1 Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        recovery_key_hash TEXT NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'therapist', 'admin')),
        mobile_number VARCHAR(30),
        age INT,
        gender VARCHAR(30),
        address TEXT,
        streak_count INT DEFAULT 1,
        mindfulness_score INT DEFAULT 10,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- Safe migration for existing DB schemas
      ALTER TABLE users ADD COLUMN IF NOT EXISTS public_id VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(30);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS age INT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(30);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS access_code_hash TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_access_code BOOLEAN DEFAULT FALSE;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (email);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_id_unique ON users (public_id) WHERE public_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_mobile_unique ON users (mobile_number) WHERE mobile_number IS NOT NULL;

      -- OTP Verification Table
      CREATE TABLE IF NOT EXISTS user_otps (
        id VARCHAR(64) PRIMARY KEY,
        identifier VARCHAR(255) NOT NULL,
        otp_hash TEXT NOT NULL,
        challenge_id VARCHAR(64) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        attempts INT DEFAULT 0,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_otps_challenge ON user_otps (challenge_id);
      CREATE INDEX IF NOT EXISTS idx_user_otps_identifier ON user_otps (identifier);

      CREATE TABLE IF NOT EXISTS mood_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mood_label VARCHAR(50) NOT NULL,
        energy_level INT CHECK (energy_level BETWEEN 1 AND 5),
        valence_score NUMERIC(4, 2),
        notes TEXT,
        logged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_mood_user_time ON mood_logs(user_id, logged_at DESC);

      CREATE TABLE IF NOT EXISTS journal_entries (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        encrypted_content TEXT NOT NULL,
        iv VARCHAR(64) NOT NULL,
        auth_tag VARCHAR(64) NOT NULL,
        sentiment_tag VARCHAR(100),
        cognitive_distortion VARCHAR(150),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_journal_user_time ON journal_entries(user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(64) NOT NULL,
        duration_seconds INT NOT NULL,
        completed BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_activity_user_time ON activity_logs(user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS companion_memories (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        memory_type VARCHAR(32) NOT NULL CHECK (memory_type IN ('short_term', 'distilled_summary', 'preference')),
        summary_text TEXT NOT NULL,
        importance_weight NUMERIC(3, 2) DEFAULT 0.5,
        last_recalled_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_companion_memory_user ON companion_memories(user_id, memory_type);

      CREATE TABLE IF NOT EXISTS therapy_roadmaps (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        active_track VARCHAR(100) DEFAULT 'Mindful Foundations',
        milestones_json JSONB DEFAULT '[]',
        current_stage_index INT DEFAULT 0,
        progress_percentage INT DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_assessments (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        total_score INT NOT NULL,
        band VARCHAR(32) NOT NULL,
        answers_json JSONB NOT NULL,
        completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_assessments_user ON user_assessments(user_id, completed_at DESC);

      -- 2. Phase 2 Tables
      CREATE TABLE IF NOT EXISTS digital_twin_profiles (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stress_index INT DEFAULT 35,
        resilience_buffer INT DEFAULT 65,
        emotional_velocity NUMERIC(4, 2) DEFAULT 0.0,
        baseline_equilibrium JSONB DEFAULT '{"meanValence":0.45,"variability":0.18}',
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS mood_predictions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        horizon_days INT DEFAULT 7,
        predicted_trend VARCHAR(50) NOT NULL,
        confidence_score NUMERIC(3, 2) NOT NULL,
        explanation_factors JSONB NOT NULL,
        computed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_predictions_user ON mood_predictions(user_id, computed_at DESC);

      CREATE TABLE IF NOT EXISTS early_warning_flags (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('info', 'moderate', 'elevated', 'critical')),
        trigger_reason TEXT NOT NULL,
        therapist_notified BOOLEAN DEFAULT FALSE,
        client_acknowledged BOOLEAN DEFAULT FALSE,
        flagged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_warnings_user ON early_warning_flags(user_id, flagged_at DESC);

      -- 3. Phase 3 Tables
      CREATE TABLE IF NOT EXISTS therapist_profiles (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        license_number VARCHAR(100) NOT NULL,
        licensing_board VARCHAR(150) NOT NULL,
        specialties JSONB DEFAULT '["CBT", "Anxiety", "Mindfulness"]',
        bio TEXT,
        verification_status VARCHAR(30) DEFAULT 'under_review' CHECK (verification_status IN ('registered', 'documents_pending', 'under_review', 'approved', 'rejected', 'more_info_required', 'suspended')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clinical_consents (
        id VARCHAR(64) PRIMARY KEY,
        client_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        therapist_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
        granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS consent_scopes (
        id VARCHAR(64) PRIMARY KEY,
        consent_id VARCHAR(64) NOT NULL REFERENCES clinical_consents(id) ON DELETE CASCADE,
        scope_name VARCHAR(60) NOT NULL,
        is_granted BOOLEAN DEFAULT TRUE,
        UNIQUE(consent_id, scope_name)
      );

      CREATE TABLE IF NOT EXISTS consent_audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        consent_id VARCHAR(64) NOT NULL REFERENCES clinical_consents(id) ON DELETE CASCADE,
        accessor_therapist_id VARCHAR(64) NOT NULL REFERENCES users(id),
        accessed_scope VARCHAR(60) NOT NULL,
        ip_address VARCHAR(50),
        accessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS session_bookings (
        id VARCHAR(64) PRIMARY KEY,
        client_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        therapist_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        preferred_therapist_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        session_type VARCHAR(50) DEFAULT 'check_in',
        mode VARCHAR(20) DEFAULT 'video',
        slot_duration_minutes INT DEFAULT 45,
        preferred_slot TIMESTAMPTZ NOT NULL,
        proposed_slot TIMESTAMPTZ,
        client_encrypted_note TEXT,
        consent_share_note BOOLEAN DEFAULT FALSE,
        status VARCHAR(32) DEFAULT 'requested',
        decline_reason TEXT,
        decline_note TEXT,
        rejection_reason TEXT,
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS therapist_availability (
        id VARCHAR(64) PRIMARY KEY,
        therapist_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        weekly_schedule JSONB NOT NULL DEFAULT '{"monday":[],"tuesday":[],"wednesday":[],"thursday":[],"friday":[],"saturday":[],"sunday":[]}',
        timezone VARCHAR(60) DEFAULT 'Asia/Kolkata',
        slot_duration_minutes INT DEFAULT 45,
        buffer_minutes INT DEFAULT 10,
        leave_dates JSONB DEFAULT '[]',
        one_off_slots JSONB DEFAULT '[]',
        is_available_now BOOLEAN DEFAULT FALSE,
        last_heartbeat TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_therapist_avail_therapist ON therapist_availability(therapist_id);

      CREATE TABLE IF NOT EXISTS session_state_history (
        id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL REFERENCES session_bookings(id) ON DELETE CASCADE,
        from_state VARCHAR(50),
        to_state VARCHAR(50) NOT NULL,
        changed_by VARCHAR(64) REFERENCES users(id),
        changed_by_role VARCHAR(30),
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_session_hist_session ON session_state_history(session_id, created_at ASC);

      -- 4. Phase 4 Tables
      CREATE TABLE IF NOT EXISTS community_profiles (
        id VARCHAR(64) PRIMARY KEY,
        anonymous_alias VARCHAR(80) UNIQUE NOT NULL,
        avatar_seed VARCHAR(50) NOT NULL,
        opt_in_community BOOLEAN DEFAULT TRUE,
        intention_tags JSONB DEFAULT '["Mindfulness", "Sleep Routine"]',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS community_circles (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS community_posts (
        id VARCHAR(64) PRIMARY KEY,
        circle_id VARCHAR(64) NOT NULL REFERENCES community_circles(id),
        author_alias VARCHAR(80) NOT NULL REFERENCES community_profiles(anonymous_alias) ON DELETE CASCADE,
        post_text TEXT NOT NULL,
        heart_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS peer_matches (
        id VARCHAR(64) PRIMARY KEY,
        profile_a_alias VARCHAR(80) NOT NULL REFERENCES community_profiles(anonymous_alias),
        profile_b_alias VARCHAR(80) NOT NULL REFERENCES community_profiles(anonymous_alias),
        matched_focus VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'concluded')),
        matched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inner_world_states (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tree_growth_stage NUMERIC(3, 2) DEFAULT 0.20,
        foliage_density NUMERIC(3, 2) DEFAULT 0.30,
        ambient_weather VARCHAR(30) DEFAULT 'golden_hour',
        firefly_warmth NUMERIC(3, 2) DEFAULT 0.60,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- 5. Phase 5 Tables
      CREATE TABLE IF NOT EXISTS external_data_sources (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('sleep', 'wearables', 'calendar', 'voice_tone', 'facial_affect')),
        is_authorized BOOLEAN DEFAULT FALSE,
        granted_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        UNIQUE(user_id, source_type)
      );

      CREATE TABLE IF NOT EXISTS multimodal_metrics (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        source_type VARCHAR(30) NOT NULL,
        metric_payload JSONB NOT NULL,
        ingested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_multimodal_user ON multimodal_metrics(user_id, source_type, ingested_at DESC);

      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS title VARCHAR(150) DEFAULT 'Licensed Clinical Psychologist';
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100);
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS therapist_type VARCHAR(100) DEFAULT 'Clinical Psychologist';
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS skills_practised JSONB DEFAULT '[]';
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS education_entries JSONB DEFAULT '[]';
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS years_of_experience INT DEFAULT 0;
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '["English"]';
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS consultation_modes JSONB DEFAULT '["chat", "voice", "video"]';
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS consultation_fee INT DEFAULT 0;
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT TRUE;
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS licence_verified_externally BOOLEAN DEFAULT FALSE;
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS external_verification_notes TEXT;
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS assigned_admin_notes TEXT;
      ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_therapist_id VARCHAR(64) REFERENCES users(id);

      ALTER TABLE session_bookings ADD COLUMN IF NOT EXISTS outcome VARCHAR(50);
      ALTER TABLE session_bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT;

      CREATE TABLE IF NOT EXISTS therapist_documents (
        id VARCHAR(64) PRIMARY KEY,
        therapist_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doc_type VARCHAR(60) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        storage_key VARCHAR(255) NOT NULL,
        status VARCHAR(30) DEFAULT 'submitted',
        reject_reason TEXT,
        uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        reviewed_by VARCHAR(64) REFERENCES users(id),
        reviewed_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_therapist_docs_therapist ON therapist_documents(therapist_id);

      CREATE TABLE IF NOT EXISTS session_declines (
        id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        therapist_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        reason TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'open',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_declines_session ON session_declines(session_id);
      CREATE INDEX IF NOT EXISTS idx_declines_therapist ON session_declines(therapist_id);

      CREATE TABLE IF NOT EXISTS decline_threads (
        id VARCHAR(64) PRIMARY KEY,
        decline_id VARCHAR(64) NOT NULL REFERENCES session_declines(id) ON DELETE CASCADE,
        sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_role VARCHAR(32) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_decline_thread_decline ON decline_threads(decline_id);

      CREATE TABLE IF NOT EXISTS system_configs (
        key VARCHAR(64) PRIMARY KEY,
        config_value JSONB NOT NULL,
        updated_by VARCHAR(64) REFERENCES users(id),
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS crisis_events (
        id VARCHAR(64) PRIMARY KEY,
        trigger_type VARCHAR(64) DEFAULT 'safety_trigger',
        triggered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_crisis_events_time ON crisis_events(triggered_at DESC);

      CREATE TABLE IF NOT EXISTS therapist_complaints (
        id VARCHAR(64) PRIMARY KEY,
        client_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        therapist_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        details TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_complaints_therapist ON therapist_complaints(therapist_id);

      -- Migrate legacy status values if any
      UPDATE therapist_profiles SET verification_status = 'approved' WHERE verification_status = 'verified';
      UPDATE therapist_profiles SET verification_status = 'under_review' WHERE verification_status = 'pending';

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

      -- Part 5 migrations for session_bookings
      ALTER TABLE session_bookings DROP CONSTRAINT IF EXISTS session_bookings_status_check;
      ALTER TABLE session_bookings ALTER COLUMN therapist_id DROP NOT NULL;
      ALTER TABLE session_bookings ADD COLUMN IF NOT EXISTS preferred_therapist_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE session_bookings ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'video';
      ALTER TABLE session_bookings ADD COLUMN IF NOT EXISTS slot_duration_minutes INT DEFAULT 45;
      ALTER TABLE session_bookings ADD COLUMN IF NOT EXISTS proposed_slot TIMESTAMPTZ;
      ALTER TABLE session_bookings ADD COLUMN IF NOT EXISTS consent_share_note BOOLEAN DEFAULT FALSE;
      ALTER TABLE session_bookings ADD COLUMN IF NOT EXISTS decline_reason TEXT;
      ALTER TABLE session_bookings ADD COLUMN IF NOT EXISTS decline_note TEXT;
      ALTER TABLE session_bookings ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE session_bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT;
      ALTER TABLE session_bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
      CREATE INDEX IF NOT EXISTS idx_session_client ON session_bookings(client_id);
      CREATE INDEX IF NOT EXISTS idx_session_therapist ON session_bookings(therapist_id);
      CREATE INDEX IF NOT EXISTS idx_session_status ON session_bookings(status);
      CREATE INDEX IF NOT EXISTS idx_session_preferred_slot ON session_bookings(preferred_slot);

      -- Part 6 Community Sanctuary tables & migrations
      ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS user_id VARCHAR(64) UNIQUE REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_facilitator BOOLEAN DEFAULT FALSE;
      ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'visible';
      ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS report_count INT DEFAULT 0;
      CREATE INDEX IF NOT EXISTS idx_comm_posts_circle ON community_posts(circle_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS post_hearts (
        id VARCHAR(64) PRIMARY KEY,
        post_id VARCHAR(64) NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_post_hearts_post ON post_hearts(post_id);

      CREATE TABLE IF NOT EXISTS post_reports (
        id VARCHAR(64) PRIMARY KEY,
        post_id VARCHAR(64) NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        reporter_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_post_reports_post ON post_reports(post_id);

      ALTER TABLE peer_matches ADD COLUMN IF NOT EXISTS user_a_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE peer_matches ADD COLUMN IF NOT EXISTS user_b_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE peer_matches DROP CONSTRAINT IF EXISTS peer_matches_status_check;
      ALTER TABLE peer_matches ADD CONSTRAINT peer_matches_status_check CHECK (status IN ('active', 'concluded', 'blocked'));
      CREATE INDEX IF NOT EXISTS idx_peer_matches_status ON peer_matches(status);

      -- Part 7 Opt-In Notifications & Quiet Hours tables
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        opt_in BOOLEAN DEFAULT FALSE,
        consent_timestamp TIMESTAMPTZ,
        quiet_hours_enabled BOOLEAN DEFAULT TRUE,
        quiet_hours_start VARCHAR(5) DEFAULT '22:00',
        quiet_hours_end VARCHAR(5) DEFAULT '07:00',
        session_updates BOOLEAN DEFAULT TRUE,
        reminders BOOLEAN DEFAULT TRUE,
        therapist_verification_updates BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_notif_pref_user ON notification_preferences(user_id);

      CREATE TABLE IF NOT EXISTS notification_consent_audit (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(32) NOT NULL,
        previous_opt_in BOOLEAN,
        new_opt_in BOOLEAN,
        consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        client_ip VARCHAR(64),
        user_agent TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_notif_audit_user ON notification_consent_audit(user_id, consent_timestamp DESC);

      CREATE TABLE IF NOT EXISTS in_app_notifications (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(120) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        status VARCHAR(30) DEFAULT 'delivered',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_notif_user_read ON in_app_notifications(user_id, is_read, created_at DESC);



    `);

    // Seed community circles
    await client.query(`
      INSERT INTO community_circles (id, title, description) VALUES
      ('circle_breath_quiet', 'Sanctuary of Gentle Stillness', 'A quiet circle focusing on breath pacing, down-regulation, and intentional screen pauses.'),
      ('circle_rhythm_sleep', 'Evening Calm & Restful Rhythm', 'Fellow travelers supporting each other in regular bedtime habits and peaceful evening wind-downs.'),
      ('circle_creative_compassion', 'Creative Growth & Kind Words', 'A warm space celebrating daily emotional growth, mindful creation, and treating ourselves with grace.'),
      ('gratitude-garden', 'Gratitude Garden', 'Share small daily blessings and joyful moments.'),
      ('mindful-breathing', 'Breath & Stillness', 'Reflections from your daily grounding and breathwork.'),
      ('daily-wins', 'Quiet Victories', 'Celebrate steps taken, no matter how small.')
      ON CONFLICT (id) DO NOTHING;
    `);

    
    // Seed demo clinician only in development/test, flagged is_demo, never approved
    if (process.env.NODE_ENV !== 'production') {
      try {
        const demoFilePath = path.join(__dirname, '..', 'data', 'seedDemoClinician.json');
        if (fs.existsSync(demoFilePath)) {
          const demo = JSON.parse(fs.readFileSync(demoFilePath, 'utf8'));
          const therapistUserRes = await client.query("SELECT id FROM users WHERE id = $1 OR email = $2", [demo.id, demo.email]);
          if (therapistUserRes.rows.length === 0) {
            await client.query(`
              INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, mobile_number, age, gender)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (id) DO NOTHING;
            `, [
              demo.id,
              demo.public_id,
              demo.email,
              demo.password_hash || 'demo_hash',
              demo.salt || 'salt',
              demo.recovery_key_hash || 'demo_rec',
              demo.name,
              demo.role,
              demo.mobile_number,
              demo.age,
              demo.gender
            ]);
          }
          await client.query(`
            INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, specialties, bio, is_available, title, verification_status, is_demo)
            VALUES (
              'tp_sarah_vance',
              $1,
              $2,
              $3,
              $4::jsonb,
              $5,
              FALSE,
              $6,
              $7,
              $8
            )
            ON CONFLICT (user_id) DO UPDATE SET is_demo = $8, verification_status = $7;
          `, [demo.id, demo.license_number, demo.licensing_board, JSON.stringify(demo.specialties), demo.bio, demo.title, demo.verification_status, demo.is_demo]);
        }
      } catch (seedErr) {
        console.warn('⚠️ Could not load seedDemoClinician.json:', seedErr.message);
      }
    }

    // ── Phase A & B: companion conversation word-tracking (ephemeral, 24h expiry, strict privacy) ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS companion_user_words (
        id          VARCHAR(64) PRIMARY KEY,
        user_id     VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        convo_id    VARCHAR(64) NOT NULL,
        word        VARCHAR(120) NOT NULL,
        added_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        expires_at  TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
      );
      ALTER TABLE companion_user_words ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours');
      CREATE INDEX IF NOT EXISTS idx_cum_user_convo ON companion_user_words(user_id, convo_id);
      CREATE INDEX IF NOT EXISTS idx_cum_expires ON companion_user_words(expires_at);
    `);

    // ── Step 0: Encrypted Clinical Messages, Access Logs, and Append-Only Admin Audit Log ──
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

      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id VARCHAR(64) PRIMARY KEY,
        admin_id VARCHAR(64),
        action VARCHAR(80) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(64),
        reason TEXT,
        ip VARCHAR(50),
        details JSONB,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE admin_audit_log DROP CONSTRAINT IF EXISTS admin_audit_log_admin_id_fkey;
      ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS details JSONB;
      CREATE INDEX IF NOT EXISTS idx_admin_audit_time ON admin_audit_log(timestamp DESC);
    `);

    await client.query('COMMIT');
    console.log('✅ PostgreSQL [mindcare_db] fully initialized with all 20 tables for Phases 1–5.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL initialization error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Auto-run initialization
initPostgresDatabase().catch(err => {
  console.error('Failed to init PostgreSQL:', err.message);
});
