import { useEffect, useRef } from 'react';
import { createBrain } from '../../lib/brain.js';
import { webglOK, prefersReduced } from '../../lib/env.js';

/** Small self-running brain (client Today / breathing). calm: 0..1 */
export default function BrainCanvas({ calm = 1, pulses = 24, className = '', label = 'A softly breathing brain illustration' }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas || !webglOK()) return;
    const b = createBrain(canvas, { pulses }); let raf, run = true; const t0 = performance.now();
    const ptr = { x: 0, y: 0 }; const mv = (e) => { ptr.x = e.clientX / innerWidth - .5; ptr.y = e.clientY / innerHeight - .5; }; addEventListener('pointermove', mv);
    const loop = () => { if (!run) return; b.render((performance.now() - t0) / 1000, calm, ptr); if (!prefersReduced()) raf = requestAnimationFrame(loop); };
    loop();
    const io = new IntersectionObserver(([e]) => { const vis = e.isIntersecting; if (vis && !run) { run = true; loop(); } if (!vis) { run = false; cancelAnimationFrame(raf); } }); io.observe(canvas);
    const ro = new ResizeObserver(() => { b.resize(); if (prefersReduced()) b.render(0, calm, ptr); }); ro.observe(canvas);
    return () => { run = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); removeEventListener('pointermove', mv); b.dispose(); };
  }, [calm, pulses]);
  return <canvas ref={ref} className={className} role="img" aria-label={label} />;
}
