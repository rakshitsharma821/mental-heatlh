import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createBrain } from '../../lib/brain.js';
import { createContours } from '../../lib/contours.js';
import { webglOK, prefersReduced, finePointer } from '../../lib/env.js';
import { UI_STRINGS as S } from '../../config/strings';
gsap.registerPlugin(ScrollTrigger);

const RANGES = [[-1, 0, .18, .26], [.26, .32, .50, .56], [.56, .62, .76, .82], [.82, .88, 1.01, 1.1]];

/** Scroll-driven busy → calm hero. One WebGL canvas + one 2D canvas, both paused when off-screen. All copy comes from config/strings.js */
export default function StoryStage({ user }) {
  const story = useRef(null), brainEl = useRef(null), linesEl = useRef(null), cue = useRef(null), bar = useRef(null);
  const panels = useRef([]), meters = useRef([]);
  const [plain, setPlain] = useState(false);

  useEffect(() => {
    if (prefersReduced() || !webglOK()) { setPlain(true); return undefined; }
    let lenis, raf = 0, run = true, P = 0, Ps = 0, tick; const t0 = performance.now(); const ptr = { x: 0, y: 0 };
    if (finePointer() && typeof window !== 'undefined' && !window.lenis) {
      lenis = new Lenis({ lerp: .09 });
      lenis.on('scroll', ScrollTrigger.update);
      tick = (t) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }
    let brain;
    let lines;
    try {
      brain = createBrain(brainEl.current, { offsetX: .22, onBreath: (d) => { if (cue.current) cue.current.textContent = d === 'in' ? S.hero.breatheIn : S.hero.breatheOut; } });
      lines = createContours(linesEl.current);
    } catch {
      setPlain(true);
      return undefined;
    }
    const size = () => { if (brain) brain.resize(); if (lines) lines.resize(); }; window.addEventListener('resize', size); size();
    const mv = (e) => { ptr.x = e.clientX / innerWidth - .5; ptr.y = e.clientY / innerHeight - .5; }; window.addEventListener('pointermove', mv);

    function applyPanels(p) {
      panels.current.forEach((el, i) => { if (!el) return; const [a, b, c, d] = RANGES[i];
        let o = p < a ? 0 : p < b ? (p - a) / (b - a) : p < c ? 1 : p < d ? 1 - (p - c) / (d - c) : 0; if (i === 0 && p < b) o = 1;
        el.style.opacity = o.toFixed(3); el.style.transform = `translateY(${((1 - o) * 18 * (p < b ? 1 : -1)).toFixed(1)}px)`; el.style.pointerEvents = o > .5 ? 'auto' : 'none'; });
      const m = p < .3 ? 0 : p < .7 ? 1 : 2; meters.current.forEach((e, i) => e && e.classList.toggle('on', i === m));
      if (bar.current) bar.current.style.width = p * 100 + '%'; if (cue.current) cue.current.style.opacity = p > .5 && p < .82 ? 1 : 0;
    }
    function frame() {
      if (!run) return; const t = (performance.now() - t0) / 1000;
      const stageH = story.current?.firstChild?.offsetHeight || window.innerHeight;
      const r = story.current?.getBoundingClientRect() || { top: 0 };
      const maxScroll = Math.max(1, (story.current?.offsetHeight || 1) - stageH);
      P = Math.min(1, Math.max(0, -r.top / maxScroll));
      Ps += (P - Ps) * .07;
      applyPanels(Ps);
      if (brain) brain.render(t, Ps, ptr);
      if (lines) lines.draw(t, Ps);
      raf = requestAnimationFrame(frame);
    }
    frame();
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !run) { run = true; frame(); } if (!e.isIntersecting) { run = false; cancelAnimationFrame(raf); } }); io.observe(story.current);
    return () => { run = false; cancelAnimationFrame(raf); io.disconnect(); if (tick) gsap.ticker.remove(tick); if (lenis) lenis.destroy(); window.removeEventListener('resize', size); window.removeEventListener('pointermove', mv); if (brain) brain.dispose(); ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  const setP = (i) => (el) => { panels.current[i] = el; };
  const setM = (i) => (el) => { meters.current[i] = el; };
  const st = S.story;
  return (
    <section id="story" ref={story} className={`story ${plain ? 'plain' : ''}`} aria-label="Introduction">
      <div className="stage">
        <canvas ref={linesEl} className="fill" aria-hidden="true" />
        <canvas ref={brainEl} className="fill brain" aria-hidden="true" />
        <div className="copy">
          <div className="panel" ref={setP(0)}>
            <div className="eyebrow">{S.hero.badge}</div>
            <h1>{S.hero.titleLine1} <em>{S.hero.titleLine2}</em></h1>
            <p className="lede">{S.hero.subtext}</p>
            <div className="cta">
              <Link className="btn-primary" to={user ? '/dashboard' : '/register'}>{user ? S.hero.ctaDashboard : S.hero.ctaRegister}</Link>
              <Link className="arrow-link crisis-link" to="/crisis">{st.helpNow}</Link>
            </div>
          </div>
          {[['p1', 1], ['p2', 2], ['p3', 3]].map(([k, i]) => (
            <div className="panel" ref={setP(i)} key={k}>
              <div className="eyebrow">{st[k + 'Eyebrow']}</div>
              <h2 className="big">{st[k + 'Title']} <em>{st[k + 'Em']}</em></h2>
              <p className="lede">{st[k + 'Desc']}</p>
              {i === 3 && <div className="cta"><a className="arrow-link" href="#how">{st.p3Cta}</a></div>}
            </div>))}
        </div>
        <div className="cue" ref={cue} aria-hidden="true">{S.hero.breatheIn}</div>
        <div className="meter" aria-hidden="true"><span ref={setM(0)}>{st.meterBusy}</span><span ref={setM(1)}>{st.meterSettling}</span><span ref={setM(2)}>{st.meterCalm}</span><div className="bar"><i ref={bar} /></div></div>
      </div>
    </section>
  );
}
