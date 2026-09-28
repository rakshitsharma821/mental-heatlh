import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../services/audio';
import AmbientCanvas from '../components/three/AmbientCanvas';

export default function Games() {
  const [poppedCount, setPoppedCount] = useState(0);
  const canvasRef = useRef(null);
  const bubblesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 380;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize bubbles with nature-health palette
    const colors = ['#52b788', '#40916c', '#f6bd60', '#72a1bf', '#d4a373'];
    const createBubble = () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 30 + Math.random() * 50,
      r: 22 + Math.random() * 24,
      speed: 0.7 + Math.random() * 0.9,
      color: colors[Math.floor(Math.random() * colors.length)],
      wobble: Math.random() * 100,
      popped: false
    });

    bubblesRef.current = Array.from({ length: 18 }, createBubble);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bubblesRef.current.forEach(b => {
        b.y -= b.speed;
        b.wobble += 0.03;
        const currentX = b.x + Math.sin(b.wobble) * 1.5;

        // Reset if went above
        if (b.y < -50) {
          b.y = canvas.height + 40;
          b.x = Math.random() * canvas.width;
        }

        // Draw soft glowing bubble
        ctx.save();
        ctx.beginPath();
        ctx.arc(currentX, b.y, b.r, 0, Math.PI * 2);

        const grad = ctx.createRadialGradient(currentX - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, currentX, b.y, b.r);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        grad.addColorStop(0.4, b.color + '77');
        grad.addColorStop(1, b.color + '33');

        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Shimmer highlight
        ctx.beginPath();
        ctx.arc(currentX - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();

        ctx.restore();
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    bubblesRef.current.forEach(b => {
      const currentX = b.x + Math.sin(b.wobble) * 1.5;
      const dist = Math.hypot(clickX - currentX, clickY - b.y);
      if (dist < b.r + 8) {
        // Pop!
        soundEngine.playPop();
        setPoppedCount(prev => prev + 1);
        b.y = canvas.height + 40;
        b.x = Math.random() * canvas.width;
      }
    });
  };

  const getEncouragement = () => {
    if (poppedCount >= 30) return '✨ Complete kinetic reset. Take a gentle breath in.';
    if (poppedCount >= 15) return '🌿 Your nervous system is settling into quiet ease.';
    if (poppedCount >= 5) return '🫧 Notice shoulders dropping down and relaxing.';
    return 'Click or tap any bubble to burst tension softly.';
  };

  return (
    <div className="games-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh' }}>
      <AmbientCanvas count={20} speed={0.2} />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--primary-dark)', fontWeight: 700 }}>
            Sensory Decompression
          </span>
          <h1 style={{ fontSize: '2.4rem', marginTop: '6px', marginBottom: '8px', color: 'var(--text-primary)' }}>StressBurst & Mindful Play</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Gentle interactive kinetic exercises to unhook the mind from rumination.
          </p>
        </div>

        {/* StressBurst Interactive Canvas */}
        <div className="glass-card" style={{ padding: '28px', marginBottom: '36px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>🫧 StressBurst Kinetic Canvas</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{getEncouragement()}</p>
            </div>
            <div style={{
              background: 'rgba(82, 183, 136, 0.15)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--primary-dark)',
              padding: '6px 16px',
              borderRadius: '100px',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              {poppedCount} Bubbles Bursted
            </div>
          </div>

          <div style={{
            width: '100%',
            height: '380px',
            background: 'linear-gradient(180deg, #f0f7f2 0%, #e6efe8 100%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            position: 'relative',
            cursor: 'crosshair',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 10px rgba(33, 64, 47, 0.05)'
          }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => setPoppedCount(0)}
              className="btn-ghost"
              style={{ padding: '8px 20px', fontSize: '0.82rem' }}
            >
              Reset Counter ↺
            </button>
          </div>
        </div>

        {/* Therapy Arcade Modules */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>🪨</div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Zen Stone Stacking</h4>
            <p style={{ color: '#8aa9c4', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '14px' }}>
              Practice patience and equilibrium through physical balance exercises.
            </p>
            <span style={{ fontSize: '0.75rem', color: '#6ec6e6', fontWeight: 600 }}>Available in Daily Rhythm</span>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>🔔</div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Singing Bowl Sound Immersion</h4>
            <p style={{ color: '#8aa9c4', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '14px' }}>
              Pure sine harmonic tones at 432 Hz and 528 Hz to soothe mental overthinking.
            </p>
            <button
              onClick={() => soundEngine.playChime('inhale')}
              className="btn-ghost"
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              Play Chime Tone 🔔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
