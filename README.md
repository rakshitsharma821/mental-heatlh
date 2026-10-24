# 🌿 MindCare Sanctuary (Version 2.0.0)

> A clinically-grounded, zero-leakage, botanical mental wellness & clinical consultation platform built with **React 18 + Vite + Three.js** on the frontend, **Node.js/Express + PostgreSQL 18 + Socket.io (WebRTC)** on the backend, and **AES-256-GCM** encryption at rest.

---

## 📑 Table of Contents

1. [Architecture Overview & Core Guarantees](#-architecture-overview--core-guarantees)
2. [Prerequisites & System Requirements](#-prerequisites--system-requirements)
3. [Quick Start & Setup Instructions](#-quick-start--setup-instructions)
   - [1. PostgreSQL Database Setup](#1-postgresql-database-setup)
   - [2. Backend Setup & Configuration](#2-backend-setup--configuration)
   - [3. Frontend Setup](#3-frontend-setup)
4. [Environment Variables Reference](#-environment-variables-reference)
5. [Database Migrations & Seeding](#-database-migrations--seeding)
   - [Initial Super Admin Seeding](#initial-super-admin-seeding)
   - [Development Demo Accounts](#development-demo-accounts)
6. [Testing, Security Verification & Production Build](#-testing-security-verification--production-build)
   - [Automated Test Suite (Parts 0–7)](#automated-test-suite-parts-07)
   - [Zero Hardcoded Secrets Check](#zero-hardcoded-secrets-check)
   - [Frontend Production Build](#frontend-production-build)
7. [Clinical Video/Voice Calls: HTTPS & TURN Architecture](#-clinical-videovoice-calls-https--turn-architecture)
8. [Data Retention & DPDP Privacy Architecture](#-data-retention--dpdp-privacy-architecture)
9. [Future Enhancements Roadmap](#-future-enhancements-roadmap)

---

## 🏛️ Architecture Overview & Core Guarantees

MindCare Sanctuary is structured around strict clinical boundaries, safe language enforcement, and zero-leakage privacy:

- **Three Distinct User Portals**:
  - **Sanctuary Member (Client)**: Age 20–25 initial cohort with randomized `MC-XXXXXX` Public IDs. Non-distracting focus-mode questionnaire, encrypted reflections, mood tracking, gentle breathing exercises, and opt-in peer sanctuary.
  - **Licensed Clinician (Therapist)**: `THR-XXXXXX` Therapist IDs. Practice availability calendar, assigned consultation requests workspace, encrypted clinical notes, and dismissible profile setup.
  - **Clinical Governance (Admin & Super Admin)**: `ADM-XXXXXX` Admin IDs. Password + Salted One-Time Access Code authentication. Zero-access to client private diaries or mood texts; oversees clinician credentialing, session pipelines, blocked terms, and append-only governance audits.
- **Single Source of Truth for Safe Language (`shared/safeLanguage.js`)**:
  - Unifies crisis patterns, soft synonyms, blocked vocabulary (self-harm, depression, anxiety, panic, abuse), and Romanized/Devanagari Hinglish.
  - Deterministic crisis detection executes **prior** to any LLM call, immediately offering India emergency helplines (**Tele-MANAS: 14416**, **KIRAN: 1800-599-0019**) with affirmative consent gating.
- **Zero Hardcoded Secrets**:
  - Verified automatically via `npm run check:hardcoded` across all frontend and backend source trees.
- **Strict Opt-In Notifications (Part 7)**:
  - Notifications are completely **OFF by default**.
  - Restorative sleep quiet hours (10:00 PM – 7:00 AM IST) hold non-urgent alerts.
  - Guaranteed silencing during Questionnaire Focus Mode.

---

## 💻 Prerequisites & System Requirements

Ensure the following tools are installed on your workstation or deployment server:

- **Node.js**: `v18.0.0` or higher (tested with Node `v20.x` and `v24.x`)
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: `v15.0` or higher (tested on PostgreSQL 18)
- **Modern Web Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari (WebRTC & WebGL support required for Three.js sanctuary and video consultations).

---

## 🚀 Quick Start & Setup Instructions

### 1. PostgreSQL Database Setup

1. Start your local PostgreSQL server:
   ```powershell
   # Windows example (adjust path for your installation):
   & "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "C:\Program Files\PostgreSQL\18\data"
   ```
2. Connect to PostgreSQL using `psql` or pgAdmin:
   ```sql
   CREATE DATABASE mindcare_db;
   ```
3. Ensure the database user has full read/write privileges on `mindcare_db`.

### 2. Backend Setup & Configuration

1. Install dependencies across root, backend, and frontend:
   ```bash
   npm install
   npm --prefix backend install
   npm --prefix frontend install
   ```
2. Copy the environment configuration template:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```
3. Edit `backend/.env` with your PostgreSQL password (`DB_PASSWORD`), unique JWT and encryption keys, and unique Super Admin bootstrap credentials (see [Environment Variables Reference](#-environment-variables-reference) below). Do not reuse credentials shown in examples or commit your `.env` files.
4. Run table initialization and seed the Super Admin account:
   ```bash
   npm run seed:admin
   ```
5. (Optional) In development, seed demo accounts for quick testing:
   ```bash
   npm run seed:demo
   ```
6. Start the backend API & WebRTC signaling server:
   ```bash
   npm run dev:backend
   # Server runs at http://localhost:5000 (Signaling on port 5000)
   ```

### 3. Frontend Setup

1. Start the Vite development server:
   ```bash
   npm --prefix frontend run dev
   # Vite development server starts at http://localhost:3000
   ```
2. Open your browser and navigate to `http://localhost:3000`.

---

## ⚙️ Environment Variables Reference

All runtime configurations and secrets are passed strictly via environment variables. Copy `backend/.env.example` to `backend/.env` before launching.

| Variable Name | Required | Default / Example Value | Description |
|---|:---:|---|---|
| `PORT` | Optional | `5000` | Port for the Express backend and Socket.io server. |
| `NODE_ENV` | Optional | `development` | Set to `production` in staging/live environments. |
| `CLIENT_ORIGIN` | Optional | `http://localhost:3000` | Allowed CORS origin for frontend client requests. |
| `DB_HOST` | Required | `127.0.0.1` | PostgreSQL database host address. |
| `DB_PORT` | Required | `5433` | PostgreSQL database port. |
| `DB_NAME` | Required | `mindcare_db` | PostgreSQL database name. |
| `DB_USER` | Required | `postgres` | Database username. |
| `DB_PASSWORD` | Required | *`<your_secure_password>`* | Database password. |
| `DATABASE_URL` | Optional | `postgresql://...` | Full PostgreSQL connection URI (overrides individual `DB_*` variables). |
| `JWT_SECRET` | **Required** | *Minimum 32-char high-entropy string* | Secret key for signing and verifying JSON Web Tokens. |
| `JWT_EXPIRES_IN` | Optional | `7d` | Lifetime of issued authentication tokens. |
| `ENCRYPTION_KEY` | **Required** | *64-hex char (32-byte) key* | Master key for AES-256-GCM encryption of client journals and clinical notes at rest. |
| `OPENROUTER_API_KEY` | Optional | *`<sk-or-...>`* | API key for OpenRouter AI companion (Aria). Fallback rule-based replies engage if absent. |
| `OPENROUTER_MODEL` | Optional | `nvidia/nemotron-3-super-120b-a12b:free` | Primary conversational LLM model for Aria wellness chats. |
| `OPENROUTER_FALLBACK_MODEL` | Optional | `nvidia/nemotron-3.5-lightning:free` | High-availability fallback model if primary model experiences latency. |
| `OTP_PROVIDER` | Optional | `console` | OTP dispatch mechanism: `console` (prints to stdout in dev) \| `email` \| `twilio` \| `fast2sms`. |
| `CLIENT_OTP_REQUIRED` | Optional | `false` | When `true`, client login requires an OTP code in addition to password. |
| `ADMIN_OTP_REQUIRED` | Optional | `true` | When `true`, administrator login strictly requires a salted one-time access code. |
| `ADMIN_PUBLIC_ID` | Optional | `ADM-SANCTUARY-01` | Public ID assigned to the seeded Super Administrator. |
| `ADMIN_EMAIL` | Optional | `admin@mindcare.com` | Root Super Administrator login email. |
| `ADMIN_NAME` | Optional | `Super Administrator` | Display name for the initial Super Administrator. |
| `ADMIN_INITIAL_PASSWORD`| **Required to seed** | *Set a unique secret* | Initial password for the seeded Super Administrator (must change on first login). |
| `ADMIN_INITIAL_ACCESS_CODE` | **Required to seed** | *Set a unique secret* | One-time bootstrap access code for Super Admin setup. |
| `STORAGE_TYPE` | Optional | `local` | Document storage provider: `local` (encrypted disk vault) \| `s3`. |
| `UPLOAD_DIR` | Optional | `./uploads/therapist_vault` | Directory for encrypted clinician verification documents. |
| `MAX_FILE_SIZE_MB` | Optional | `15` | Maximum allowed document upload file size in megabytes. |
| `ALLOWED_DOC_TYPES` | Optional | `application/pdf,image/jpeg,image/png` | Comma-separated list of permitted MIME types for verification dossiers. |
| `STUN_SERVER` | Optional | `stun:stun.l.google.com:19302` | STUN server URL for NAT traversal in WebRTC calls. |
| `TURN_SERVER` | Optional | *`turn:your-turn-relay.net:3478`* | TURN relay server URL for symmetric NAT / corporate firewall traversal. |
| `TURN_USERNAME` | Optional | *`turn_user`* | TURN server authentication username. |
| `TURN_CREDENTIAL` | Optional | *`turn_secret`* | TURN server authentication credential. |
| `RATE_LIMIT_WINDOW_MS`| Optional | `900000` (15 mins) | Window duration for client and login rate limiters. |
| `RATE_LIMIT_MAX` | Optional | `100` | Max requests permitted per IP per rate-limit window. |
| `COMPANION_WORD_TTL_HOURS` | Optional | `24` | TTL duration for companion ephemeral vocabulary before automatic purge. |
| `SESSION_TIMEOUT_MINUTES` | Optional | `60` | Inactivity session timeout. |
| `QUIET_HOURS_START` | Optional | `22:00` | Start of restorative sleep quiet hours (24h IST format). |
| `QUIET_HOURS_END` | Optional | `07:00` | End of restorative sleep quiet hours (24h IST format). |

---

## 🗄️ Database Migrations & Seeding

The PostgreSQL database schema is self-migrating. When `initPostgresDatabase()` runs (at server startup or before any test suite), it creates all required tables and indexes idempotently using `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

### Database Tables (20 Core Entities)
1. `users` — Authentication credentials, role (`client`, `therapist`, `admin`, `super_admin`), public ID (`MC-*`, `THR-*`, `ADM-*`), age, status, salts.
2. `mood_logs` — Daily emotional states (calm, grounded, peaceful, reflective, uneasy) and intensity ratings.
3. `journal_entries` — AES-256-GCM encrypted reflective writings with cognitive distortion tags.
4. `mindful_activities` — Completed box breathing, grounding sensory exercises, and restorative sleep habits.
5. `companion_memories` — Positive summaries and conversation milestones.
6. `companion_user_words` — 24-hour TTL ephemeral user-introduced vocabulary (auto-purged; never exposed to admins).
7. `therapy_milestones` — Gentle client therapy progress markers and milestones.
8. `therapist_profiles` — Clinician practice credentials, RCI license, specialties, title, availability, and review status.
9. `therapist_documents` — AES-256-GCM encrypted verification vault (degrees, licenses, photo IDs) with magic-byte validation.
10. `therapist_availability` — Recurring weekly clinical hours and live consultation slots.
11. `session_bookings` — Appointment requests, status lifecycle, modes (`video`, `voice`, `chat`), proposed slots, and client consent notes.
12. `session_state_history` — Append-only state machine audit trail tracking every transition from `requested` to `completed`.
13. `session_declines` — Clinician decline records with structured reasons and admin "Ask Why" threads.
14. `decline_threads` — Two-way dialogue between clinician and clinical coordinator for reassignment.
15. `clinical_therapy_plans` — Encrypted collaborative care treatment plans between approved therapist and member.
16. `clinical_consents` — Pairing key records granting therapist scoped read access to binary metrics.
17. `consent_audit_logs` — Immutable audit log of every pairing key access, scope adjustment, or severance.
18. `crisis_events` — Anonymized timestamps of safety triggers (zero personal identifiable text recorded).
19. `admin_audit_log` — Append-only record of every administrative action (passwords/OTPs strictly omitted).
20. `community_profiles`, `community_circles`, `community_posts`, `post_hearts`, `post_reports`, `peer_matches` — Safe anonymous reflections and kindred 1-on-1 peer matching.
21. `notification_preferences`, `notification_consent_audit`, `in_app_notifications` — Opt-in notification controls, quiet hours, and immutable consent history.

### Initial Super Admin Seeding
To seed the initial root Super Admin account:
```bash
npm run seed:admin
```
This provisions `admin@mindcare.com` with a randomized public ID (e.g. `ADM-XXXXXX`), sets `must_change_password = true`, hashes the initial password and one-time access code with cryptographically secure salts, and logs the event to `admin_audit_log`.

### Development Demo Accounts
To provision testing accounts in development:
```bash
npm run seed:demo
```
This generates:
- **Client**: `MC-DEMO-01` (`user1@mindcare.test` / `Password123!`)
- **Therapist**: `THR-DEMO-01` (`therapist1@mindcare.test` / `Password123!`, approved status)
- **Admin**: `ADM-DEMO-01` (`admin1@mindcare.test` / `Password123!` / access code `DEMO-ADM-2026`)

---

## 🧪 Testing, Security Verification & Production Build

The project features a comprehensive test suite across every architectural phase and functional part.

### Automated Test Suite (Parts 0–7)

Run the entire suite of 24 test runners (44 distinct automated test cases):
```bash
npm test
```

To run individual Part test suites:
```bash
# Part 0: Hardening, Verification & RBAC Guards
node --test backend/tests/step0_verification.test.js

# Part 1: Entry Flow, 3 Logins & OTP Recovery
node --test backend/tests/part1_entry_auth.test.js

# Part 2: Client Experience, Questionnaire & Unified Bands
node --test backend/tests/part2_client_experience.test.js

# Part 3: Clinician Verification & Encrypted Document Vault
node --test backend/tests/part3_therapist_verification.test.js

# Part 4: Admin Governance, Decline Reviews & DPDP Erasure
node --test backend/tests/part4_admin_system.test.js

# Part 5: Clinical Availability, Session State Machine & Gated Live Rooms
node --test backend/tests/part5_availability_sessions.test.js

# Part 6: Community Sanctuary, Thematic Circles & Kindred Peer Matching
node --test backend/tests/part6_community_sanctuary.test.js

# Part 7: Opt-in Notifications, Sleep Quiet Hours & Focus Mode Shield
node --test backend/tests/part7_opt_in_notifications.test.js
```

### Zero Hardcoded Secrets Check

Verify that zero API keys, private credentials, or development URLs are committed:
```bash
npm run check:hardcoded
```
*Expected result:* `✅ PASS: No insecure hardcoded secrets, keys, or invalid localhost URLs detected.`

### Frontend Production Build

Compile and bundle the React 18 production bundle via Vite:
```bash
npm run build:frontend
```
*Expected result:* `✓ built in ~1.8s` with `dist/` directory generated cleanly.

---

## 📹 Clinical Video/Voice Calls: HTTPS & TURN Architecture

MindCare Sanctuary includes real-time WebRTC live rooms (`ClinicalLiveRoom.jsx`) gated strictly to confirmed sessions between an authorized client and approved clinician:

### 1. Browser HTTPS / TLS Requirement
Modern browsers (`navigator.mediaDevices.getUserMedia`) strictly require a **Secure Context** (HTTPS or `localhost`) to access the microphone and camera.
- In **development**: Accessing `http://localhost:3000` is treated as a secure context by Chromium and Firefox.
- In **production**: You **must** terminate HTTPS using a valid TLS/SSL certificate (e.g. Let's Encrypt, Cloudflare, or an AWS Application Load Balancer). Attempting to launch consultations over unencrypted HTTP will cause the browser to reject media permissions with a `NotAllowedError`.

### 2. NAT Traversal: STUN vs. TURN Relays
- **STUN (`stun:stun.l.google.com:19302`)**: Handles direct peer-to-peer audio/video streaming when both parties are behind standard asymmetric NAT routers. STUN does **not** relay any audio/video data; it only discovers public IP/port mappings.
- **TURN Relay Requirement**: If either the client or clinician is behind a symmetric NAT (common on mobile LTE networks, hospitals, and corporate Wi-Fi), direct P2P connections will fail. In production, configure a TURN relay server (e.g., Coturn or Twilio Network Traversal) in your `.env` file via `TURN_SERVER`, `TURN_USERNAME`, and `TURN_CREDENTIAL`.

### 3. Grace Period & Fallback Protection
- Clinical live rooms only accept WebRTC signaling if the session status is `'confirmed'` and the current time is within a **±15-minute grace period** of the appointment.
- If the clinician is delayed or unable to connect, the interface gracefully offers an immediate fallback to the **Aria AI Wellness Companion** or 24/7 national helplines.

---

## 🔒 Data Retention & DPDP Privacy Architecture

The platform complies with the Digital Personal Data Protection (DPDP) Act:

1. **Right to Erasure (Right to be Forgotten)**:
   - When an account deletion is initiated (`DELETE /api/admin/users/:id`), the user's email, name, and phone are irreversibly anonymized (`deleted_XXXX@erased.mindcare.internal`), credentials and salts are purged, and all sensitive clinical evaluations and journal entries are permanently cleared from storage.
2. **Field-Level Encryption at Rest**:
   - Client reflections and clinician treatment plans are encrypted using **AES-256-GCM** with unique initialization vectors (`iv`) and authentication tags (`authTag`). Even with direct database read access, records are unreadable without the runtime `ENCRYPTION_KEY`.
3. **Append-Only Auditing**:
   - `admin_audit_log`, `consent_audit_logs`, and `notification_consent_audit` are append-only. Modification and deletion endpoints are strictly rejected with HTTP 404/403.
4. **Ephemeral Companion Memory**:
   - Terms introduced by the client during AI companion chats are stored in `companion_user_words` with a 24-hour expiry column and are automatically cleaned up. These words are never visible to administrators or third-party providers.

---

## 🔮 Future Enhancements Roadmap

1. **Broader Demographic Cohorts**: Expand from the initial 20–25 young adult cohort to support pediatric/adolescent guided wellness and senior cognitive care.
2. **Native Mobile App with Hardware-Backed Keystore**: Native iOS (Swift) and Android (Kotlin) clients utilizing Secure Enclave / Android Keystore for biometric device authentication and true OS-level app locking.
3. **Time-Based One-Time Password (TOTP) Authenticator Apps**: Complement email/SMS OTPs with RFC 6238 TOTP support (Google Authenticator, Microsoft Authenticator, 1Password) and hardware security keys (FIDO2/WebAuthn YubiKeys) for administrators and clinicians.
4. **Intelligent Clinician Auto-Assignment**: Machine learning matching algorithms that suggest appropriate clinicians based on language preferences, clinical score band, therapeutic modalities (CBT, DBT, Somatic), and mutual timezone availability.
5. **Wearables & Sleep Ingestion Integration**: Optional client-controlled sync with HealthKit / Google Health Connect for nocturnal HRV down-regulation tracking and restorative rhythm insights.

---

### 🌿 MindCare Sanctuary — May your journey be gentle, grounded, and kind.
