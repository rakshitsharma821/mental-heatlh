// ============================================
// MindCare Sanctuary — Playable Bubble Field (Scratch-Built)
// Infinite, calming bubble drift canvas. Bubbles drift upward slowly
// and pop with a soft ripple on click/tap.
// Zero scores, zero timers, zero levels, zero points pressure.
// ============================================

import React, { useRef, useEffect, useState } from 'react';

const BUBBLE_PALETTES = [
  { fill: 'rgba(116, 198, 157, 0.35)', stroke: 'rgba(53, 114, 85, 0.55)', ripple: 'rgba(116, 198, 157, 0.8)' },
  { fill: 'rgba(157, 132, 183, 0.32)', stroke: 'rgba(107, 82, 134, 0.55)', ripple: 'rgba(157, 132, 183, 0.8)' },
  { fill: 'rgba(107, 163, 199, 0.32)', stroke: 'rgba(62, 118, 153, 0.55)', ripple: 'rgba(107, 163, 199, 0.8)' },
  { fill: 'rgba(233, 154, 128, 0.30)', stroke: 'rgba(194, 109, 82, 0.55)', ripple: 'rgba(233, 154, 128, 0.8)' },
  { fill: 'rgba(246, 189, 96, 0.28)', stroke: 'rgba(196, 137, 45, 0.55)', ripple: 'rgba(246, 189, 96, 0.8)' }
];

export default function PlayableBubbleField() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    try {
      const media = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const stored = typeof localStorage !== 'undefined' && localStorage.getItem('mindcare_reduce_motion') === 'true';
      setIsReducedMotion(Boolean(media || stored));
    } catch (_) {
      setIsReducedMotion(false);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement.clientWidth || 800);
    let height = (canvas.height = 320);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth || 800;
      height = canvas.height = 320;
    };
    window.addEventListener('resize', handleResize);

    // Initial bubbles
    const bubbleCount = 22;
    const bubbles = [];
    const ripples = [];

    const createBubble = (startY = null) => {
      const p = BUBBLE_PALETTES[Math.floor(Math.random() * BUBBLE_PALETTES.length)];
      return {
        x: Math.random() * width,
        y: startY !== null ? startY : Math.random() * height,
        r: 16 + Math.random() * 22,
        speedY: 0.35 + Math.random() * 0.45,
        swaySpeed: 0.012 + Math.random() * 0.015,
        swayAmp: 12 + Math.random() * 18,
        swayOffset: Math.random() * Math.PI * 2,
        baseX: 0,
        palette: p,
        highlightOffset: 0.28
      };
    };

    for (let i = 0; i < bubbleCount; i++) {
      const b = createBubble();
      b.baseX = b.x;
      bubbles.push(b);
    }

    let frame = 0;

    const render = () => {
      animRef.current = requestAnimationFrame(render);
      frame++;

      ctx.clearRect(0, 0, width, height);

      // Soft serene background wash
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, 'rgba(237, 245, 250, 0.7)');
      bg.addColorStop(0.5, 'rgba(243, 238, 248, 0.55)');
      bg.addColorStop(1, 'rgba(250, 249, 245, 0.9)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Draw and update active ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.r += 1.8;
        rip.alpha -= 0.024;
        if (rip.alpha <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = rip.color.replace('0.8)', `${rip.alpha * 0.75})`);
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, Math.max(0, rip.r - 8), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${rip.alpha * 0.5})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }

      // Draw and update bubbles
      bubbles.forEach(b => {
        if (!isReducedMotion) {
          b.y -= b.speedY;
          b.x = b.baseX + Math.sin(frame * b.swaySpeed + b.swayOffset) * b.swayAmp;

          // Wrap to bottom if drifted off top
          if (b.y + b.r < -10) {
            b.y = height + b.r + Math.random() * 20;
            b.baseX = Math.random() * width;
            b.x = b.baseX;
          }
        }

        // Outer Bubble
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.palette.fill;
        ctx.fill();
        ctx.strokeStyle = b.palette.stroke;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Inner Specular Light Glint
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.24, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fill();

        ctx.restore();
      });
    };

    render();

    // Interaction: click/tap to pop bubble with soft ripple
    const handlePointerDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
      if (clientX === undefined || clientY === undefined) return;

      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      // Check for hit bubble
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const dist = Math.hypot(b.x - clickX, b.y - clickY);
        if (dist <= b.r + 6) {
          // Spawn ripple
          ripples.push({
            x: b.x,
            y: b.y,
            r: b.r * 0.5,
            alpha: 1.0,
            color: b.palette.ripple
          });

          // Respawn bubble at bottom
          b.y = height + b.r + 10;
          b.baseX = Math.random() * width;
          b.x = b.baseX;
          break;
        }
      }
    };

    canvas.addEventListener('click', handlePointerDown);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: true });

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', handlePointerDown);
      canvas.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isReducedMotion]);

  return (
    <div
      className="bubble-field-container"
      style={{
        width: '100%',
        height: '320px',
        borderRadius: '26px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(82, 183, 136, 0.2)',
        boxShadow: '0 8px 30px rgba(33, 64, 47, 0.05), inset 0 2px 8px rgba(255, 255, 255, 0.6)',
        marginBottom: '36px',
        background: '#ffffff'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'pointer'
        }}
        aria-label="Playable calming bubble drift field. Tap or click any floating bubble to softly pop."
      />

      <div style={{
        position: 'absolute',
        top: '16px',
        left: '20px',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent-forest)' }}>
          Tactile Kinetic Play
        </span>
        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
          Unhurried Bubble Drift
        </span>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '14px',
        right: '20px',
        pointerEvents: 'none',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        background: 'rgba(255, 255, 255, 0.85)',
        padding: '5px 14px',
        borderRadius: 'var(--radius-full)',
        backdropFilter: 'blur(6px)',
        border: '1px solid var(--border-subtle)'
      }}>
        Tap or click gently to pop • Zero timers, zero scores
      </div>
    </div>
  );
}
