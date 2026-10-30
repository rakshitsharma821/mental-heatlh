// ============================================
// MindCare — Landing (redesign)
// Scroll-driven 3D brain story (busy → calm) + editorial sections.
// ALL copy is read from config/strings.js; nothing is hard-coded here.
// ============================================
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UI_STRINGS as S } from '../config/strings';
import StoryStage from '../components/landing/StoryStage';
import { useReveal } from '../lib/useReveal';
import '../styles/landing.css';

function Row({ n, title, children, to, cta }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`row reveal ${n ? '' : 'nonum'}`}>
      {n && <div className="n">{n}</div>}
      <h3>{title}</h3>
      <div><p>{children}</p>{to && <Link className="arrow-link" to={to}>{cta}</Link>}</div>
    </div>
  );
}
const strip = (t = '') => t.replace(/\s*[→↗]\s*$/, '');

export default function Landing() {
  const { user } = useAuth();
  const f = S.sessionFlow, L = S.landing;
  return (
    <div className="landing-page">
      <StoryStage user={user} />

      <section className="block" id="how"><div className="wrap">
        <div className="eyebrow">{f.heading}</div>
        <h2 className="section-title">{f.subheading}</h2>
        <div className="rows">
          <Row n="01" title={f.step1Title} to="/register" cta={strip(S.hero.ctaRegister)}>{f.step1Desc}</Row>
          <Row n="02" title={f.step2Title}>{f.step2Desc}</Row>
          <Row n="03" title={f.step3Title}>{f.step3Desc}</Row>
          <Row n="04" title={f.step4Title}>{f.step4Desc}</Row>
        </div>
      </div></section>

      <section className="block" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="eyebrow">{L.coreTitle}</div>
        <div className="rows">
          <Row title={L.pillar1Title} to="/breathing" cta={strip(L.pillar1Cta)}>{L.pillar1Desc}</Row>
          <Row title={L.pillar2Title}>{L.pillar2Desc}</Row>
          <Row title={L.pillar3Title} to="/journal" cta={strip(L.pillar3Cta)}>{L.pillar3Desc}</Row>
          <Row title={L.pillar4Title} to="/crisis" cta={strip(L.pillar4Cta)}>{L.pillar4Desc}</Row>
        </div>
      </div></section>

      <section className="block alt"><div className="wrap two">
        <div><div className="eyebrow">{L.privacyBadge}</div><h2 className="section-title">{L.privacyTitle}</h2><p className="lede" style={{ fontSize: '1rem' }}>{L.privacySubtitle}</p></div>
        <div className="facts">
          {[1, 2, 3].map((i) => <div className="fact" key={i}><b>{L[`privacyItem${i}Title`]}</b>{L[`privacyItem${i}Desc`]}</div>)}
        </div>
      </div></section>

      <section className="block pros"><div className="wrap">
        <p className="big2">{f.professionalNoticePrompt}</p>
        <p className="lede" style={{ maxWidth: '34em' }}>{f.professionalNoticeGuarantee}</p>
        <div className="cta"><Link className="btn-primary" to="/register?role=therapist">{f.professionalNoticeLink}</Link></div>
      </div></section>
    </div>
  );
}
