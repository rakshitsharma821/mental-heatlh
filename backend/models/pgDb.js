// ============================================
// MindCare Sanctuary — PostgreSQL Database Engine & Schema Migrator
// Connects to PostgreSQL 18 on port 5433 with full ACID constraints & JSONB support
// ============================================

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5433,
  database: process.env.DB_NAME || 'mindcare_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Rakshit@123',
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
        streak_count INT DEFAULT 1,
        mindfulness_score INT DEFAULT 10,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

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
        verification_status VARCHAR(20) DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'suspended')),
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
        therapist_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_type VARCHAR(50) DEFAULT 'check_in',
        preferred_slot TIMESTAMPTZ NOT NULL,
        client_encrypted_note TEXT,
        status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

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
    `);

    // Seed community circles
    const circlesRes = await client.query('SELECT COUNT(*) as count FROM community_circles');
    if (parseInt(circlesRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO community_circles (id, title, description) VALUES
        ('gratitude-garden', 'Gratitude Garden', 'Share small daily blessings and joyful moments.'),
        ('mindful-breathing', 'Breath & Stillness', 'Reflections from your daily grounding and breathwork.'),
        ('daily-wins', 'Quiet Victories', 'Celebrate steps taken, no matter how small.');
      `);
    }

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
