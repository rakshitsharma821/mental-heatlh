import React from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_CONFIG } from '../config/legalConfig';

export default function TermsConditions() {
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
        <span style={{ color: 'var(--text-secondary)' }}>Terms & Conditions</span>
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
          Legal Terms of Service & Clinical Governance
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
          Terms & Conditions of Use
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          Effective Date: {lastUpdated} • Binding legal agreement between you and {LEGAL_CONFIG.legalEntityName}
        </p>
      </header>

      {/* Critical Emergency Disclaimer */}
      <aside aria-label="Crisis Helpline Notice" style={{
        background: 'rgba(239, 68, 68, 0.08)',
        borderLeft: '4px solid #dc2626',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '36px',
        fontSize: '0.9rem'
      }}>
        <strong style={{ color: '#dc2626', display: 'block', marginBottom: '4px' }}>
          CRITICAL: Non-Emergency Healthcare Disclaimer
        </strong>
        <span>
          {LEGAL_CONFIG.clinicalDisclaimer} 
          If you are experiencing suicidal thoughts, self-harm impulses, severe psychotic episodes, or a medical crisis, 
          <strong> immediately disconnect from this platform and dial 112 (National Emergency) or 14416 (Tele-MANAS)</strong>, 
          or visit the nearest hospital emergency department.
        </span>
      </aside>

      <div className="policy-content" style={{ fontSize: '0.96rem' }}>
        {/* Section 1 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            1. Acceptance of Terms & White-Label Operating Notice
          </h2>
          <p>
            These Terms & Conditions (“Terms”) constitute a legally binding electronic contract between you (“User”, “Client”, or “Clinician”) 
            and <strong>{LEGAL_CONFIG.legalEntityName}</strong> (“Company”, “we”, “our”, or “us”), governing your access to and use of 
            the <strong>{LEGAL_CONFIG.platformName}</strong> platform, website, interactive modules, and tele-consultation infrastructure.
          </p>
          <p>
            By creating an account, clicking “I Agree”, booking a consultation, or otherwise interacting with our platform, 
            you acknowledge that you have read, understood, and agreed to be bound by these Terms, our <Link to="/privacy-policy" style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>Privacy Policy</Link>, 
            and our <Link to="/refund-policy" style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>Refund & Cancellation Policy</Link>.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            2. Platform Nature: Self-Care & Tele-Consultation Intermediary
          </h2>
          <p>
            {LEGAL_CONFIG.platformName} operates two distinct categories of digital services:
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li>
              <strong>Self-Directed Wellness Modules:</strong> Guided breathwork, physiological pacing canvases, mood logging, focus games, 
              and the Aria wellness companion. These tools are provided strictly for general psychological relaxation, emotional self-reflection, 
              and stress reduction. <em>They do not constitute medical diagnosis, clinical psychiatric evaluation, or prescriptive psychotherapy.</em>
            </li>
            <li>
              <strong>Tele-Consultation Intermediary:</strong> A secure technological conduit connecting clients with independent, licensed mental health professionals 
              (Clinical Psychologists, Counseling Psychologists, and Psychiatrists). The Company verifies credentials upon onboarding, 
              but the professional-client clinical relationship is formed solely between the client and the respective clinician.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            3. Telemedicine Guidelines & Prescription Drug Restrictions
          </h2>
          <p>
            All remote consultations hosted via our encrypted audio/video infrastructure operate under the 
            <strong> Telemedicine Practice Guidelines</strong> issued under the <em>National Medical Commission Act, 2019</em> and the <em>Indian Medical Council Act, 1956</em>:
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li>
              <strong>Prescription Limitations:</strong> Clinicians consulting via tele-consultation are strictly barred under Indian law from prescribing 
              any drugs listed in <strong>Schedule X of the Drugs and Cosmetics Rules, 1945</strong> (including potent sedatives, narcotics, and controlled psychotropics), 
              or any habit-forming substances.
            </li>
            <li>
              <strong>Clinician Autonomy:</strong> The attending clinician reserves the absolute clinical judgment to determine whether a virtual consultation is appropriate for your condition. 
              If the clinician determines that an in-person physical clinical examination is necessary, they will advise you accordingly.
            </li>
            <li>
              <strong>Audio/Video Privacy:</strong> In compliance with clinical confidentiality, neither {LEGAL_CONFIG.platformName} nor its system administrators 
              record, monitor, eavesdrop, or tap into live tele-consultation audio/video feeds.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            4. User Eligibility & Account Integrity
          </h2>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li>
              <strong>Age Requirement:</strong> You must be at least 18 years of age to register independently for a Sanctuary account or book a consultation. 
              Users under 18 may access self-guided modules only under the supervision and verifiable consent of a parent or legal guardian.
            </li>
            <li>
              <strong>Truthful Representation:</strong> You agree to provide accurate, current, and complete information during registration and consultation intake.
            </li>
            <li>
              <strong>Account Safeguarding:</strong> You are solely responsible for maintaining the confidentiality of your login credentials and personal recovery phrases. 
              You agree to notify us immediately at <a href={`mailto:${LEGAL_CONFIG.contact.supportEmail}`} style={{ color: 'var(--primary-dark)' }}>{LEGAL_CONFIG.contact.supportEmail}</a> of any unauthorized access.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            5. Prohibited Misuse & Sanctuary Code of Conduct
          </h2>
          <p>To preserve our safe and compassionate space, you strictly agree NOT to:</p>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li>Use the platform or its community circles to harass, abuse, stalk, threaten, or defame clinicians, moderators, or other members.</li>
            <li>Post or transmit explicit hate speech, violent content, self-harm glorification, or sexually explicit materials.</li>
            <li>Attempt to probe, reverse-engineer, decompile, or breach the authentication or encryption systems guarding our databases.</li>
            <li>Record, screenshot, or disseminate confidential tele-consultation sessions without explicit, signed mutual consent.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            6. Intellectual Property Rights
          </h2>
          <p>
            All software code, 3D procedural canvases, visual themes, typography architectures, soundscapes, Aria safe-language rules, 
            and branding associated with {LEGAL_CONFIG.platformName} are the exclusive intellectual property of {LEGAL_CONFIG.legalEntityName} 
            or its licensors, protected under the <em>Indian Copyright Act, 1957</em> and international intellectual property treaties. 
            You are granted a limited, personal, non-exclusive, non-transferable license to access and use the platform for personal self-care.
          </p>
        </section>

        {/* Section 7 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            7. Limitation of Liability & Disclaimers
          </h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE INDIAN LAW, {LEGAL_CONFIG.legalEntityName}, ITS DIRECTORS, EMPLOYEES, AND PARTNERS 
            SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES RESULTING FROM YOUR USE OF OR INABILITY 
            TO USE THE PLATFORM. 
          </p>
          <p>
            WE EXPRESSLY DISCLAIM ANY LIABILITY ARISING OUT OF CLINICAL ADVICE OR THERAPEUTIC SERVICES RENDERED BY INDEPENDENT LICENSED PRACTITIONERS. 
            THE PLATFORM IS PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS WITHOUT WARRANTIES OF ANY KIND.
          </p>
        </section>

        {/* Section 8 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            8. Governing Law & Dispute Resolution
          </h2>
          <p>
            These Terms shall be governed by, construed, and enforced in accordance with the substantive laws of the 
            <strong> Republic of India</strong>, without regard to conflict of law principles.
          </p>
          <p>
            Any dispute, controversy, or claim arising out of or relating to these Terms or the breach, termination, or invalidity thereof 
            shall be submitted to the exclusive jurisdiction of the competent courts of <strong>Bengaluru, Karnataka, India</strong>.
          </p>
        </section>

        {/* Section 9 */}
        <section style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
            9. Corporate & Grievance Contact
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
            If you have questions regarding these Terms or wish to raise a formal grievance, please contact our Legal & Grievance desk:
          </p>
          <div style={{ fontSize: '0.86rem', lineHeight: 1.8, color: 'var(--text-primary)' }}>
            <div><strong>Entity:</strong> {LEGAL_CONFIG.legalEntityName}</div>
            <div><strong>Office:</strong> {LEGAL_CONFIG.registeredOffice.addressLine1}, {LEGAL_CONFIG.registeredOffice.city}, {LEGAL_CONFIG.registeredOffice.state} - {LEGAL_CONFIG.registeredOffice.postalCode}</div>
            <div><strong>Grievance Officer:</strong> {LEGAL_CONFIG.grievanceOfficer.name} ({LEGAL_CONFIG.grievanceOfficer.email})</div>
            <div><strong>Legal Helpline:</strong> {LEGAL_CONFIG.contact.legalEmail}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
