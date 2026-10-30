import React from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_CONFIG } from '../config/legalConfig';

export default function PrivacyPolicy() {
  const lastUpdated = 'October 30, 2026';

  return (
    <div className="policy-page" style={{
      maxWidth: '960px',
      margin: '0 auto',
      padding: '48px 24px 80px',
      color: 'var(--text-primary)',
      lineHeight: 1.75
    }}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '24px', fontSize: '0.85rem' }}>
        <Link to="/" style={{ color: 'var(--primary-dark)', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>Privacy Policy</span>
      </nav>

      {/* Header Banner */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '24px',
        marginBottom: '36px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'rgba(82, 183, 136, 0.15)',
          color: 'var(--primary-dark)',
          borderRadius: '999px',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          DPDP Act 2023 & Healthcare Privacy Compliant
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
          Privacy Policy & Data Protection Notice
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          Effective Date: {lastUpdated} • Applicable to {LEGAL_CONFIG.platformName} operated by {LEGAL_CONFIG.legalEntityName}
        </p>
      </header>

      {/* Emergency Crisis Callout */}
      <aside aria-label="Crisis Helpline Notice" style={{
        background: 'rgba(239, 68, 68, 0.08)',
        borderLeft: '4px solid #dc2626',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '36px',
        fontSize: '0.9rem'
      }}>
        <strong style={{ color: '#dc2626', display: 'block', marginBottom: '4px' }}>
          Emergency Crisis & Safety Notice
        </strong>
        <span>
          {LEGAL_CONFIG.clinicalDisclaimer} 
          For immediate, toll-free 24/7 psychological assistance in India, call <strong>Tele-MANAS (14416)</strong> or <strong>KIRAN (1800-599-0019)</strong>.
        </span>
      </aside>

      <div className="policy-content" style={{ fontSize: '0.96rem' }}>
        {/* Section 1 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            1. Preamble & Data Fiduciary Identity
          </h2>
          <p>
            Welcome to {LEGAL_CONFIG.platformName} (“Sanctuary”, “we”, “us”, or “our”). This Privacy Policy describes how 
            <strong> {LEGAL_CONFIG.legalEntityName}</strong> (as the “Data Fiduciary” under the <em>Digital Personal Data Protection Act, 2023</em>) 
            collects, uses, processes, stores, and protects the personal and digital health data of users (“Data Principals”) 
            accessing our mental wellness platform, mobile interfaces, and tele-consultation services.
          </p>
          <p>
            We strictly uphold the principles of <strong>data minimization, purpose limitation, storage limitation, and cryptographic sovereignty</strong>. 
            We do not sell, rent, monetize, or broker personal data to advertising networks or third-party behavioral trackers.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            2. Personal Data We Collect & What We Strictly Do NOT Collect
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', margin: '20px 0' }}>
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-dark)', margin: '0 0 10px 0' }}>
                Data We Collect (Consent-Based Only)
              </h3>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                <li><strong>Identity & Account Data:</strong> Name or pseudonym, verified email address, hashed credentials, and optional demographic attributes (age band, general city/state).</li>
                <li><strong>Wellness & Self-Care Logs:</strong> Optional mood ratings, self-guided reflection entries, and breathing rhythm configurations.</li>
                <li><strong>Clinical Consultation Telemetry:</strong> Appointment timestamps, preferred clinician pairings, and encrypted consultation notes (only when voluntarily shared).</li>
                <li><strong>Therapist Professional Credentials:</strong> Educational certificates, RCI / State Medical Council registration numbers, and identity verification proofs (for clinicians only).</li>
              </ul>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#dc2626', margin: '0 0 10px 0' }}>
                What We Strictly Do NOT Collect
              </h3>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                <li><strong>Zero Behavioral Ad Trackers:</strong> No third-party ad pixels (e.g. Meta Pixel, TikTok Pixel, Google Ads).</li>
                <li><strong>Zero Acoustic Recording:</strong> Microphone acoustic resonance and pitch algorithms execute entirely in temporary browser memory (RAM) and are discarded instantaneously.</li>
                <li><strong>Zero Camera Feeds Stored:</strong> Micro-expression camera frames are processed on-device and never recorded or transmitted to our servers.</li>
                <li><strong>Zero Unencrypted Clinical Notes:</strong> Therapy notes are safeguarded with authenticated client/clinician field-level encryption.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            3. Lawful Basis & Specified Purposes of Processing (DPDP Act 2023)
          </h2>
          <p>
            Under Section 6 of India’s DPDP Act 2023, personal data is processed solely on the basis of <strong>freely given, specific, informed, unconditional, and unambiguous consent</strong> 
            expressed through affirmative action. We process your data for the following specific purposes:
          </p>
          <ol style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li><strong>Provision of Calming Tools:</strong> Delivering interactive breathwork, mood tracking, and gentle cognitive reflection routines.</li>
            <li><strong>Clinical Consultation Facilitation:</strong> Enabling encrypted video/voice tele-consultations with verified, licensed mental health professionals under the <em>Telemedicine Practice Guidelines</em>.</li>
            <li><strong>Account & Security Integrity:</strong> Authenticating logins, sending one-time verification passcodes (OTP), preventing unauthorized intrusion, and rate-limiting abusive requests.</li>
            <li><strong>Statutory Compliance:</strong> Maintaining audit records required under the <em>Information Technology Act, 2000</em> and the <em>Mental Healthcare Act, 2017</em>.</li>
          </ol>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            4. Data Principal Rights Under Indian Law
          </h2>
          <p>As a Data Principal under Chapter III of the DPDP Act 2023, you possess fundamental statutory rights:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', margin: '16px 0' }}>
            <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--primary-dark)' }}>Right to Access:</strong>
              <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>View a complete summary of personal data held, processing activities, and identities of data fiduciaries with whom data is shared.</p>
            </div>
            <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--primary-dark)' }}>Right to Correction:</strong>
              <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Request correction of inaccurate, incomplete, or outdated personal data directly via Settings or through our Grievance Officer.</p>
            </div>
            <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--primary-dark)' }}>Right to Erasure:</strong>
              <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Trigger an instant, irreversible one-click data purge from Settings, erasing your journal logs, mood entries, and account records.</p>
            </div>
            <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--primary-dark)' }}>Right of Nomination:</strong>
              <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nominate an individual who shall exercise your data rights in the event of death or incapacity, as provided under Section 14.</p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            5. Cryptographic Architecture & Data Security
          </h2>
          <p>We deploy defense-in-depth security measures to protect your sensitive emotional rhythm:</p>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li><strong>Authenticated Encryption at Rest:</strong> Sensitive reflective journals and confidential therapist notes are encrypted using <strong>AES-256-GCM</strong> with unique initialization vectors (IVs) and authentication tags.</li>
            <li><strong>Transport Layer Security:</strong> All API communication and WebRTC signaling are enforced over <strong>TLS 1.3 / HTTPS</strong> with HSTS (Strict-Transport-Security) and secure CSP headers.</li>
            <li><strong>No Static Public Vaults:</strong> Uploaded therapist licenses and verification documents are vaulted outside public web roots and accessed exclusively via transient HMAC-signed single-use URLs.</li>
            <li><strong>Cryptographic Password Hashing:</strong> Credentials are hashed using Node.js native <code>crypto.scryptSync</code> with unique 16-byte random cryptographic salts per user.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            6. Data Retention, Localization & Transfer
          </h2>
          <p>
            In compliance with national data sovereignty standards, all server infrastructure and primary database instances 
            are located within the territorial boundaries of the <strong>Republic of India</strong> (AWS / DigitalOcean / Cloud facilities in Mumbai / Bengaluru).
          </p>
          <p>
            We retain your data only for as long as necessary to fulfill the specified purpose for which it was collected, or as required by applicable laws 
            (such as the 3-year medical record retention guideline under the Indian Medical Council / NMC Telemedicine Regulations). 
            Upon account deletion or expiration of the retention window, data is permanently scrubbed with zero residual backups.
          </p>
        </section>

        {/* Section 7 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            7. Protection of Children & Young Adults
          </h2>
          <p>
            {LEGAL_CONFIG.platformName} is designed as an unhurried sanctuary primarily for young adults (ages 18 and above). 
            In strict compliance with Section 9 of the DPDP Act 2023:
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li>We do not knowingly process personal data of individuals under 18 years without verifiable parental or legal guardian consent.</li>
            <li>We strictly forbid any behavioral tracking, predictive ad profiling, or targeted advertisements directed at minors.</li>
            <li>We do not deploy automated systems that could cause detrimental effects on a young person's emotional well-being.</li>
          </ul>
        </section>

        {/* Section 8: Statutory Grievance Redressal */}
        <section style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '40px'
        }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
            8. Statutory Grievance Redressal & Data Protection Officer (DPO)
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            In compliance with Section 10 of India’s DPDP Act 2023 and Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, 
            the contact details of our designated Grievance Officer and Data Protection Officer are:
          </p>
          <div style={{ fontSize: '0.88rem', lineHeight: 1.8, color: 'var(--text-primary)' }}>
            <div><strong>Officer Name:</strong> {LEGAL_CONFIG.grievanceOfficer.name}</div>
            <div><strong>Designation:</strong> {LEGAL_CONFIG.grievanceOfficer.designation}</div>
            <div><strong>Entity:</strong> {LEGAL_CONFIG.legalEntityName}</div>
            <div><strong>Registered Address:</strong> {LEGAL_CONFIG.grievanceOfficer.address}</div>
            <div><strong>Official Email:</strong> <a href={`mailto:${LEGAL_CONFIG.grievanceOfficer.email}`} style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>{LEGAL_CONFIG.grievanceOfficer.email}</a></div>
            <div><strong>Statutory SLA:</strong> {LEGAL_CONFIG.grievanceOfficer.responseSla}</div>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '16px', marginBottom: 0 }}>
            If you are not satisfied with the resolution provided by our Grievance Officer, you have the statutory right to register a complaint with the <strong>Data Protection Board of India</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
