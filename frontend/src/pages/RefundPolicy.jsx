import React from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_CONFIG } from '../config/legalConfig';

export default function RefundPolicy() {
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
        <span style={{ color: 'var(--text-secondary)' }}>Refund & Cancellation Policy</span>
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
          Consumer Fair Practice & Tele-Consultation Policy
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
          Refund & Cancellation Policy
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          Effective Date: {lastUpdated} • Clear, fair guidelines for clinical consultation bookings and subscriptions
        </p>
      </header>

      <div className="policy-content" style={{ fontSize: '0.96rem' }}>
        {/* Section 1 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            1. Preamble & Ethical Financial Commitment
          </h2>
          <p>
            At {LEGAL_CONFIG.platformName}, operated by {LEGAL_CONFIG.legalEntityName}, we believe that healing should never be accompanied by billing anxiety. 
            In compliance with the <em>Consumer Protection Act, 2019</em> and the <em>Consumer Protection (E-Commerce) Rules, 2020</em>, 
            this Policy outlines the terms governing appointment cancellations, rescheduling, and monetary refunds.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            2. Consultation Cancellation & Rescheduling Windows
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '20px 0' }}>
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--primary-dark)', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                More than 24 Hours Notice
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <strong>100% Full Refund</strong> or seamless, fee-free rescheduling to any available slot of your choice.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: '#d97706', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                4 to 24 Hours Notice
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <strong>50% Monetary Refund</strong> or a <strong>100% Free Rescheduling Credit</strong> valid for 30 calendar days.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                Under 4 Hours Notice / No-Show
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <strong>Non-Refundable</strong>, as the licensed clinician has reserved their clinical block exclusively for you and declined other appointments.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            3. Clinician Cancellations & Emergencies
          </h2>
          <p>
            In the rare event that a verified clinician must cancel an appointment due to clinical emergency or illness:
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li>You will receive an immediate SMS/Email notification.</li>
            <li>You will be offered an <strong>immediate 100% full refund</strong>, or the option to be fast-tracked to another verified clinician matching your care needs.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            4. Technical Disruption & Connection Failures
          </h2>
          <p>
            If a scheduled consultation is materially disrupted by technical server issues, WebRTC signaling failures, or platform malfunctions 
            lasting more than 15 consecutive minutes:
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li>The consultation will be marked as “Technically Incomplete”.</li>
            <li>You will be issued a <strong>100% full refund or a complimentary replacement session</strong>, verified by our technical coordination log.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            5. Refund Processing Timelines & Original Payment Source
          </h2>
          <p>
            Approved refunds are initiated immediately by our billing desk and returned to the <strong>original source of payment</strong> (UPI, NetBanking, Debit/Credit Card):
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li><strong>UPI & NetBanking:</strong> Typically reflected within 24 to 48 hours.</li>
            <li><strong>Credit / Debit Cards:</strong> Reflected within 3 to 5 business days, depending on your issuing bank's settlement cycle.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
            6. Refund Inquiries & Billing Support
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
            To request a refund, report a technical disruption, or check refund status, please contact our billing desk with your Session ID:
          </p>
          <div style={{ fontSize: '0.86rem', lineHeight: 1.8, color: 'var(--text-primary)' }}>
            <div><strong>Billing Desk:</strong> <a href={`mailto:${LEGAL_CONFIG.contact.supportEmail}`} style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>{LEGAL_CONFIG.contact.supportEmail}</a></div>
            <div><strong>Operating Hours:</strong> {LEGAL_CONFIG.contact.workingHours}</div>
            <div><strong>Entity:</strong> {LEGAL_CONFIG.legalEntityName}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
