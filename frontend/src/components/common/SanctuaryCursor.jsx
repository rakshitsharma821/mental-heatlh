// ============================================
// MindCare Sanctuary — Custom Botanical Cursor
// Smooth 60-120fps GPU-accelerated motion, firefly particle trail,
// interactive hover morphing, and clean touch/reduced-motion fallbacks
// ============================================

import React, { useEffect, useRef, useState } from 'react';

export default function SanctuaryCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const canvasRef = useRef(null);

  const [isTouchOnly, setIsTouchOnly] = useState(false);

  useEffect(() => {
    // Only disable custom cursor on strictly touch-only devices without a fine mouse/trackpad pointer
    const touchOnlyQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
    if (touchOnlyQuery.matches) {
      setIsTouchOnly(true);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Direct mutable coordinates for 60-120 FPS performance (zero React state re-renders)
    const mouse = { x: -100, y: -100, targetX: -100, targetY: -100 };
    const ring = { x: -100, y: -100 };
    let hasMoved = false;
    let isVisible = false;
    let isHoveringInteractive = false;
    let isOver3D = false;
    let isOverInput = false;
    let isClicking = false;
    let animId = null;

    // Firefly trail particles pool
    const particles = [];
    const MAX_PARTICLES = 14;

    const canvas = canvasRef.current;
    let ctx = null;
    if (canvas && !prefersReducedMotion) {
      ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const handlePointerMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;

      if (!hasMoved) {
        hasMoved = true;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        ring.x = e.clientX;
        ring.y = e.clientY;
      }

      if (!isVisible) {
        isVisible = true;
      }

      // Check element under cursor for contextual morphing
      const target = e.target;
      if (target) {
        const isInput = Boolean(
          target.closest('input, textarea, select, [contenteditable="true"]')
        );
        isOverInput = isInput;

        const isClickable = Boolean(
          target.closest('a, button, [role="button"], .clickable, .glass-card, .btn-primary, .btn-ghost, .nav-link, .nav-icon-btn, .feature-hover-card, [tabindex]:not([tabindex="-1"])')
        );
        isHoveringInteractive = !isInput && isClickable;

        const over3DElement = Boolean(
          target.closest('.hero-section, canvas:not(.sanctuary-cursor-canvas), [data-inner-world], .mood-page')
        );
        isOver3D = over3DElement;
      }

      // Spawn subtle firefly mote if moving at moderate velocity
      if (ctx && !prefersReducedMotion && !isOverInput && particles.length < MAX_PARTICLES) {
        const dx = mouse.targetX - ring.x;
        const dy = mouse.targetY - ring.y;
        const speed = Math.sqrt(dx * dx + dy * dy);

        if (speed > 3.5 && Math.random() > 0.4) {
          particles.push({
            x: mouse.targetX + (Math.random() - 0.5) * 6,
            y: mouse.targetY + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.7 - 0.25, // gentle natural upward floating drift
            size: Math.random() * 2.2 + 1.2,
            alpha: 0.7,
            color: isOver3D ? '#f6bd60' : (Math.random() > 0.4 ? '#52b788' : '#74c69d')
          });
        }
      }
    };

    const handlePointerDown = () => {
      isClicking = true;
    };

    const handlePointerUp = () => {
      isClicking = false;
    };

    const handleWindowLeave = () => {
      isVisible = false;
    };

    const handleWindowEnter = () => {
      isVisible = true;
    };

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('mouseleave', handleWindowLeave);
    window.addEventListener('mouseenter', handleWindowEnter);
    window.addEventListener('resize', handleResize);

    // Smooth Damping 60-120 FPS render loop
    const render = () => {
      animId = requestAnimationFrame(render);

      // Instant pinpoint tracking for the core dot
      mouse.x = mouse.targetX;
      mouse.y = mouse.targetY;

      // Smooth physics lerp for the trailing halo ring
      const lerpSpeed = prefersReducedMotion ? 1.0 : 0.2;
      ring.x += (mouse.x - ring.x) * lerpSpeed;
      ring.y += (mouse.y - ring.y) * lerpSpeed;

      const cursorOpacity = (!isVisible || isOverInput) ? '0' : '1';

      // Update Pinpoint Core Dewdrop Dot
      if (dotRef.current) {
        let dotScale = isClicking ? 0.75 : (isHoveringInteractive ? 1.35 : 1.0);
        dotRef.current.style.opacity = cursorOpacity;
        dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) scale(${dotScale})`;

        if (isOver3D) {
          dotRef.current.style.background = '#f6bd60'; // Warm sunlit gold over 3D scene
          dotRef.current.style.boxShadow = '0 0 10px rgba(246, 189, 96, 0.85)';
        } else if (isHoveringInteractive) {
          dotRef.current.style.background = '#52b788'; // Vibrant mint on hover
          dotRef.current.style.boxShadow = '0 0 8px rgba(82, 183, 136, 0.7)';
        } else {
          dotRef.current.style.background = '#2d6a4f'; // Deep calming forest dot
          dotRef.current.style.boxShadow = '0 0 6px rgba(45, 106, 79, 0.35)';
        }
      }

      // Update Trailing Lagging Halo Ring
      if (ringRef.current) {
        let ringScale = isClicking ? 0.85 : (isHoveringInteractive ? 1.55 : 1.0);
        ringRef.current.style.opacity = cursorOpacity;
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) scale(${ringScale})`;

        if (isOver3D) {
          ringRef.current.style.borderColor = 'rgba(246, 189, 96, 0.65)';
          ringRef.current.style.background = 'rgba(246, 189, 96, 0.12)';
        } else if (isHoveringInteractive) {
          ringRef.current.style.borderColor = 'rgba(82, 183, 136, 0.55)';
          ringRef.current.style.background = 'rgba(82, 183, 136, 0.12)';
        } else {
          ringRef.current.style.borderColor = 'rgba(45, 106, 79, 0.25)';
          ringRef.current.style.background = 'rgba(45, 106, 79, 0.04)';
        }
      }

      // Draw fading firefly motes on overlay canvas
      if (ctx && !prefersReducedMotion) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.025; // gentle fade out over ~0.5s

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('mouseleave', handleWindowLeave);
      window.removeEventListener('mouseenter', handleWindowEnter);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (isTouchOnly) {
    return null; // Touch-only devices use system touch
  }

  return (
    <>
      {/* Particle Canvas for Micro Firefly Trail */}
      <canvas
        ref={canvasRef}
        className="sanctuary-cursor-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 99997
        }}
      />

      {/* Trailing Lagging Halo Ring */}
      <div
        ref={ringRef}
        className="sanctuary-cursor-ring"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '28px',
          height: '28px',
          margin: '-14px 0 0 -14px',
          borderRadius: '50%',
          border: '1.5px solid rgba(45, 106, 79, 0.25)',
          background: 'rgba(45, 106, 79, 0.04)',
          pointerEvents: 'none',
          zIndex: 99998,
          willChange: 'transform',
          transition: 'opacity 0.2s ease, border-color 0.25s ease, background 0.25s ease'
        }}
      />

      {/* Pinpoint Core Dewdrop Dot */}
      <div
        ref={dotRef}
        className="sanctuary-cursor-dot"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '8px',
          height: '8px',
          margin: '-4px 0 0 -4px',
          borderRadius: '50%',
          background: '#2d6a4f',
          boxShadow: '0 0 6px rgba(45, 106, 79, 0.35)',
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform',
          transition: 'opacity 0.2s ease, background 0.2s ease, box-shadow 0.2s ease'
        }}
      />
    </>
  );
}
