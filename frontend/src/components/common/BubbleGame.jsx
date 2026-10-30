import { useEffect, useRef } from 'react';
import { prefersReduced } from '../../lib/env.js';
/** Slow bubbles. Touch or hover to pop → a soft ripple. No score, no timer, no losing. */
export default function BubbleGame({ tints = ['#D9CFF3', '#BFE6D1', '#F3C6A5', '#CBE6FA'] }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, x = c.getContext('2d'); let W = 0, H = 0, raf, last = performance.now(); const bubbles = [], ripples = [];
    const size = () => { const d = Math.min(devicePixelRatio, 1.5); W = c.clientWidth; H = c.clientHeight; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); };
    const spawn = (y) => bubbles.push({ x: Math.random() * W, y: y ?? H + 40, r: 20 + Math.random() * 38, vy: 10 + Math.random() * 18, ph: Math.random() * 6.28, col: tints[Math.floor(Math.random() * tints.length)] });
    size(); for (let i = 0; i < 14; i++) spawn(Math.random() * H);
    const pop = (px, py) => { for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; if (Math.hypot(b.x - px, b.y - py) < b.r) { ripples.push({ x: b.x, y: b.y, r: b.r, a: .55, col: b.col }); bubbles.splice(i, 1); spawn(); } } };
    const pt = (e) => { const r = c.getBoundingClientRect(); pop(e.clientX - r.left, e.clientY - r.top); };
    c.addEventListener('pointermove', pt); c.addEventListener('pointerdown', pt); addEventListener('resize', size);
    const still = prefersReduced();
    const tick = (now) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now; x.clearRect(0, 0, W, H);
      for (const b of bubbles) { if (!still) { b.y -= b.vy * dt; b.x += Math.sin(now / 1800 + b.ph) * 8 * dt; } if (b.y < -60) { b.y = H + 40; b.x = Math.random() * W; }
        const g = x.createRadialGradient(b.x - b.r * .35, b.y - b.r * .4, b.r * .1, b.x, b.y, b.r); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.55, b.col + 'cc'); g.addColorStop(1, b.col + '88');
        x.beginPath(); x.arc(b.x, b.y, b.r, 0, 6.283); x.fillStyle = g; x.fill(); x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 1.5; x.stroke(); }
      for (let i = ripples.length - 1; i >= 0; i--) { const r = ripples[i]; r.r += 70 * dt; r.a -= .9 * dt; if (r.a <= 0) { ripples.splice(i, 1); continue; } x.beginPath(); x.arc(r.x, r.y, r.r, 0, 6.283); x.strokeStyle = r.col; x.globalAlpha = r.a; x.lineWidth = 3; x.stroke(); x.globalAlpha = 1; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); c.removeEventListener('pointermove', pt); c.removeEventListener('pointerdown', pt); };
  }, [tints]);
  return <canvas ref={ref} className="bubbles" role="img" aria-label="Floating bubbles. Move over them to pop them gently." />;
}
