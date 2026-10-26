// ============================================
// MindCare Sanctuary — Therapeutic Interactive Games
// Evidence-informed kinetic exercises, ACT cognitive defusion,
// tactile sensory pond, and self-compassion bloom garden.
// Clean, grounded UI (no 3D slope, zero tacky emojis).
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../services/audio';
import AmbientCanvas from '../components/three/AmbientCanvas';

const DEFAULT_THOUGHTS = [
  "I feel like I'm falling behind everyone my age.",
  "What if I make mistakes and let people down?",
  "I am exhausted and everything feels like too much work.",
  "I should be doing more productive things right now.",
  "I feel on edge and unable to fully relax."
];

const REFRAME_AFFIRMATIONS = [
  "This is a passing cognitive event, not a permanent truth. You are allowed to take up space and rest.",
  "Your worth is not measured by relentless output. Stepping back is how resilience is renewed.",
  "Comparison steals your present moment. You are progressing on your own natural timetable.",
  "You do not have to figure out the whole future right now. Focus only on this current breath.",
  "Mistakes are signs of engagement and learning, not indications of your capability."
];

const SEED_PROMPTS = [
  "I showed up today even though it was hard.",
  "I paused and took a deep breath before reacting.",
  "I gave myself permission to step back and rest.",
  "I was kind to someone else or to myself.",
  "I acknowledged my limits without self-criticism."
];

export default function Games() {
  const [activeGame, setActiveGame] = useState('defusion'); // 'defusion' | 'pond' | 'garden' | 'bubbles'

  // ==========================================
  // GAME 1: THOUGHT CLOUD DEFUSION (ACT)
  // ==========================================
  const [customThought, setCustomThought] = useState('');
  const [selectedThought, setSelectedThought] = useState(DEFAULT_THOUGHTS[0]);
  const [defusedList, setDefusedList] = useState([]);
  const [activeReframe, setActiveReframe] = useState(null);
  const [isDefusing, setIsDefusing] = useState(false);

  const handleDefuseThought = () => {
    const thoughtToDefuse = customThought.trim() || selectedThought;
    if (!thoughtToDefuse || isDefusing) return;

    setIsDefusing(true);
    soundEngine.playChime('exhale');

    setTimeout(() => {
      const randomReframe = REFRAME_AFFIRMATIONS[Math.floor(Math.random() * REFRAME_AFFIRMATIONS.length)];
      setActiveReframe(randomReframe);
      setDefusedList(prev => [
        { id: Date.now(), thought: thoughtToDefuse, reframe: randomReframe, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ...prev
      ]);
      setCustomThought('');
      setIsDefusing(false);
    }, 900);
  };

  // ==========================================
  // GAME 2: ZEN RIPPLE WATER POND CANVAS
  // ==========================================
  const pondCanvasRef = useRef(null);
  const pondAnimRef = useRef(null);
  const pondStateRef = useRef({
    ripples: [],
    koi: { x: 200, y: 150, targetX: 200, targetY: 150, angle: 0, speed: 1.2, tailAngle: 0 }
  });

  useEffect(() => {
    if (activeGame !== 'pond') return;
    const canvas = pondCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 360;
    };
    resize();
    window.addEventListener('resize', resize);

    const animatePond = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep calming water gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#1b3b36');
      bgGrad.addColorStop(0.5, '#224842');
      bgGrad.addColorStop(1, '#18342f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const state = pondStateRef.current;

      // Update & Draw ripples
      state.ripples.forEach((r, idx) => {
        r.radius += r.growth;
        r.alpha -= 0.012;

        if (r.alpha > 0) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(168, 224, 203, ${r.alpha * 0.8})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(r.x, r.y, Math.max(0, r.radius - 8), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha * 0.4})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });
      state.ripples = state.ripples.filter(r => r.alpha > 0);

      // Koi fish physics & steering
      const koi = state.koi;
      const dx = koi.targetX - koi.x;
      const dy = koi.targetY - koi.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 8) {
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - koi.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        koi.angle += angleDiff * 0.06;

        koi.x += Math.cos(koi.angle) * koi.speed;
        koi.y += Math.sin(koi.angle) * koi.speed;
      } else {
        // Random leisurely drift
        koi.targetX = 60 + Math.random() * (canvas.width - 120);
        koi.targetY = 60 + Math.random() * (canvas.height - 120);
      }

      koi.tailAngle += 0.12;

      // Draw graceful koi fish
      ctx.save();
      ctx.translate(koi.x, koi.y);
      ctx.rotate(koi.angle);

      // Shadow underneath koi
      ctx.beginPath();
      ctx.ellipse(-2, 10, 22, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 25, 20, 0.35)';
      ctx.fill();

      // Fish body
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f48c06';
      ctx.fill();

      // Fish head highlight
      ctx.beginPath();
      ctx.ellipse(12, 0, 10, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2f02';
      ctx.fill();

      // Fish fins
      ctx.beginPath();
      ctx.ellipse(-2, -12, 10, 4, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 208, 0, 0.7)';
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(-2, 12, 10, 4, 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 208, 0, 0.7)';
      ctx.fill();

      // Swimming tail wag
      const tailWag = Math.sin(koi.tailAngle) * 5;
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.quadraticCurveTo(-32, tailWag * 1.5, -40, tailWag * 3);
      ctx.quadraticCurveTo(-34, tailWag * 0.8, -40, tailWag * -3);
      ctx.closePath();
      ctx.fillStyle = 'rgba(244, 140, 6, 0.85)';
      ctx.fill();

      ctx.restore();

      pondAnimRef.current = requestAnimationFrame(animatePond);
    };

    pondAnimRef.current = requestAnimationFrame(animatePond);

    return () => {
      cancelAnimationFrame(pondAnimRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [activeGame]);

  const handlePondClick = (e) => {
    const canvas = pondCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pondStateRef.current.ripples.push({
      x,
      y,
      radius: 6,
      growth: 2.2,
      alpha: 1.0
    });

    // Koi swims towards the gentle tap
    pondStateRef.current.koi.targetX = x;
    pondStateRef.current.koi.targetY = y;

    soundEngine.playChime('hold');
  };

  // ==========================================
  // GAME 3: GRATITUDE & SELF-COMPASSION BLOOM
  // ==========================================
  const [gardenFlowers, setGardenFlowers] = useState([
    { id: 1, text: "I took a moment to breathe and reset.", color: '#74c69d', type: 'Lotus' },
    { id: 2, text: "I treated my mistake with patience.", color: '#9d84b7', type: 'Lavender' }
  ]);
  const [seedText, setSeedText] = useState('');

  const handlePlantFlower = () => {
    const textToPlant = seedText.trim();
    if (!textToPlant) return;

    const flowerColors = ['#52b788', '#e9a189', '#9d84b7', '#f6bd60', '#72a1bf'];
    const flowerTypes = ['Sakura', 'Lotus', 'Jasmine', 'Iris', 'Golden Camellia'];
    const randomColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    const randomType = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];

    soundEngine.playChime('inhale');
    setGardenFlowers(prev => [
      { id: Date.now(), text: textToPlant, color: randomColor, type: randomType },
      ...prev
    ]);
    setSeedText('');
  };

  // ==========================================
  // GAME 4: STRESSBURST KINETIC BUBBLES
  // ==========================================
  const [poppedCount, setPoppedCount] = useState(0);
  const bubbleCanvasRef = useRef(null);
  const bubblesRef = useRef([]);
  const bubbleAnimRef = useRef(null);

  useEffect(() => {
    if (activeGame !== 'bubbles') return;
    const canvas = bubbleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 360;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#52b788', '#40916c', '#f6bd60', '#72a1bf', '#d4a373'];
    const createBubble = () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 30 + Math.random() * 50,
      r: 22 + Math.random() * 24,
      speed: 0.7 + Math.random() * 0.9,
      color: colors[Math.floor(Math.random() * colors.length)],
      wobble: Math.random() * 100
    });

    bubblesRef.current = Array.from({ length: 18 }, createBubble);

    const animateBubbles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bubblesRef.current.forEach(b => {
        b.y -= b.speed;
        b.wobble += 0.03;
        const currentX = b.x + Math.sin(b.wobble) * 1.5;

        if (b.y < -50) {
          b.y = canvas.height + 40;
          b.x = Math.random() * canvas.width;
        }

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

        ctx.beginPath();
        ctx.arc(currentX - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();

        ctx.restore();
      });

      bubbleAnimRef.current = requestAnimationFrame(animateBubbles);
    };

    bubbleAnimRef.current = requestAnimationFrame(animateBubbles);

    return () => {
      cancelAnimationFrame(bubbleAnimRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [activeGame]);

  const handleBubbleClick = (e) => {
    const canvas = bubbleCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    bubblesRef.current.forEach(b => {
      const currentX = b.x + Math.sin(b.wobble) * 1.5;
      const dist = Math.hypot(clickX - currentX, clickY - b.y);
      if (dist < b.r + 8) {
        soundEngine.playPop();
        setPoppedCount(prev => prev + 1);
        b.y = canvas.height + 40;
        b.x = Math.random() * canvas.width;
      }
    });
  };

  return (
    <div className="games-page" style={{ position: 'relative', padding: '36px 24px 80px', minHeight: '100vh', backgroundColor: 'var(--bg-main, #f8fbf9)' }}>
      <AmbientCanvas count={15} speed={0.15} />

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--primary-dark)', fontWeight: 700 }}>
            Therapeutic Mindful Activities
          </span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.4rem)', marginTop: '6px', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 800 }}>
            Sanctuary Play & Emotional Regulation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', maxWidth: '640px', margin: '0 auto' }}>
            Tactile, evidence-based kinetic exercises designed to break cognitive loops and rebuild self-compassion.
          </p>
        </div>

        {/* Game Navigation Selector Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '28px'
        }}>
          {[
            { id: 'defusion', label: '1. Thought Cloud Defusion (ACT)' },
            { id: 'pond', label: '2. Zen Water Ripple Pond' },
            { id: 'garden', label: '3. Gratitude Bloom Garden' },
            { id: 'bubbles', label: '4. StressBurst Kinetic Canvas' }
          ].map(g => (
            <button
              key={g.id}
              onClick={() => setActiveGame(g.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontWeight: 600,
                border: activeGame === g.id ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle, #e2e8f0)',
                background: activeGame === g.id ? 'var(--primary)' : '#ffffff',
                color: activeGame === g.id ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeGame === g.id ? '0 4px 12px rgba(45, 106, 79, 0.2)' : '0 2px 6px rgba(0, 0, 0, 0.02)'
              }}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* ========================================================= */}
        {/* GAME 1: THOUGHT CLOUD DEFUSION (ACT) */}
        {/* ========================================================= */}
        {activeGame === 'defusion' && (
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', backgroundColor: '#ffffff', boxShadow: '0 6px 24px rgba(0,0,0,0.04)', marginBottom: '32px' }}>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cognitive Defusion Exercise
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '6px' }}>
                Thought Cloud Defusion
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
                From Acceptance and Commitment Therapy (ACT): When negative thoughts feel heavy, seeing them as passing cognitive clouds helps unhook your nervous system from believing they define you.
              </p>
            </div>

            {/* Quick Pick Chips */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Select a recurring thought or type your own below:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {DEFAULT_THOUGHTS.map((th, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setSelectedThought(th); setCustomThought(''); }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      background: selectedThought === th && !customThought ? 'rgba(82, 183, 136, 0.15)' : '#f8faf9',
                      color: selectedThought === th && !customThought ? 'var(--primary-dark)' : 'var(--text-secondary)',
                      fontWeight: selectedThought === th && !customThought ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    "{th}"
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Or type what is currently weighing on your mind..."
                value={customThought}
                onChange={(e) => setCustomThought(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', fontSize: '0.9rem' }}
              />
            </div>

            {/* Cloud Display Stage */}
            <div style={{
              padding: '36px 24px',
              borderRadius: '20px',
              background: 'linear-gradient(180deg, #edf4f0 0%, #e1ece5 100%)',
              textAlign: 'center',
              border: '1.5px solid rgba(82, 183, 136, 0.25)',
              marginBottom: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '16px 28px',
                borderRadius: '100px',
                backgroundColor: isDefusing ? 'rgba(255,255,255,0.3)' : '#ffffff',
                boxShadow: isDefusing ? 'none' : '0 8px 24px rgba(0,0,0,0.06)',
                border: '1px solid rgba(82, 183, 136, 0.3)',
                maxWidth: '680px',
                transform: isDefusing ? 'scale(0.92) translateY(-14px)' : 'scale(1)',
                opacity: isDefusing ? 0.3 : 1,
                transition: 'all 0.6s ease'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Observed Thought
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  "{customThought.trim() || selectedThought}"
                </span>
              </div>

              <div style={{ marginTop: '22px' }}>
                <button
                  type="button"
                  onClick={handleDefuseThought}
                  disabled={isDefusing}
                  className="btn-primary"
                  style={{
                    padding: '12px 32px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.94rem'
                  }}
                >
                  {isDefusing ? 'Defusing Thought...' : 'Release & Defuse This Thought →'}
                </button>
              </div>

              {activeReframe && (
                <div style={{
                  marginTop: '22px',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid var(--primary)',
                  maxWidth: '640px',
                  margin: '22px auto 0',
                  textAlign: 'left'
                }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', marginBottom: '3px' }}>
                    Mindful Cognitive Reframe
                  </div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.55' }}>
                    {activeReframe}
                  </div>
                </div>
              )}
            </div>

            {/* Thoughts Defused History */}
            {defusedList.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Thoughts Released in this Session ({defusedList.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {defusedList.map(item => (
                    <div key={item.id} style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: '#f8faf9',
                      border: '1px solid rgba(0,0,0,0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          "{item.thought}"
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--primary-dark)', marginTop: '2px' }}>
                          Grounded: {item.reframe}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* GAME 2: ZEN WATER RIPPLE POND */}
        {/* ========================================================= */}
        {activeGame === 'pond' && (
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', backgroundColor: '#ffffff', boxShadow: '0 6px 24px rgba(0,0,0,0.04)', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tactile Sensory Grounding
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '4px' }}>
                  Zen Water Ripple Pond
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Click or tap anywhere on the water to generate ripples and guide the koi fish. Let rhythmic fluid movement soothe visual tension.
                </p>
              </div>

              <button
                type="button"
                onClick={() => soundEngine.playChime('complete')}
                className="btn-ghost"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                Singing Bowl Tone
              </button>
            </div>

            <div style={{
              width: '100%',
              height: '360px',
              borderRadius: '20px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: 'inset 0 2px 14px rgba(0, 0, 0, 0.25)'
            }}>
              <canvas
                ref={pondCanvasRef}
                onClick={handlePondClick}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Interactive Canvas: Tap gently to create wave oscillations.
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GAME 3: GRATITUDE & SELF-COMPASSION BLOOM */}
        {/* ========================================================= */}
        {activeGame === 'garden' && (
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', backgroundColor: '#ffffff', boxShadow: '0 6px 24px rgba(0,0,0,0.04)', marginBottom: '32px' }}>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Resilience & Self-Kindness
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '6px' }}>
                Gratitude & Self-Compassion Bloom Garden
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
                When self-doubt or demotivation sets in, acknowledge small moments of persistence. Plant seeds of self-kindness and watch your living garden grow.
              </p>
            </div>

            {/* Quick Seeds */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Select a small win to plant:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SEED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSeedText(prompt)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      background: seedText === prompt ? 'rgba(82, 183, 136, 0.15)' : '#f8faf9',
                      color: seedText === prompt ? 'var(--primary-dark)' : 'var(--text-secondary)',
                      fontWeight: seedText === prompt ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* Seed input */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Or type a moment of personal courage or self-compassion..."
                value={seedText}
                onChange={(e) => setSeedText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePlantFlower()}
                style={{ flex: 1, padding: '12px 16px', fontSize: '0.9rem' }}
              />
              <button
                type="button"
                onClick={handlePlantFlower}
                className="btn-primary"
                style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700 }}
              >
                Plant Bloom
              </button>
            </div>

            {/* Bloom Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#f8faf9',
              border: '1px solid rgba(0,0,0,0.06)'
            }}>
              {gardenFlowers.map((f) => (
                <div
                  key={f.id}
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '18px',
                    borderRadius: '14px',
                    borderLeft: `4px solid ${f.color}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: f.color, textTransform: 'uppercase' }}>
                      {f.type}
                    </span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: f.color }} />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                    "{f.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GAME 4: STRESSBURST KINETIC BUBBLES */}
        {/* ========================================================= */}
        {activeGame === 'bubbles' && (
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', backgroundColor: '#ffffff', boxShadow: '0 6px 24px rgba(0,0,0,0.04)', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Kinetic Pressure Release
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '4px' }}>
                  StressBurst Kinetic Canvas
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Click or tap any bubble to burst tension softly.
                </p>
              </div>
              <div style={{
                background: 'rgba(82, 183, 136, 0.15)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                color: 'var(--primary-dark)',
                padding: '6px 16px',
                borderRadius: '100px',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                {poppedCount} Bubbles Burst
              </div>
            </div>

            <div style={{
              width: '100%',
              height: '360px',
              background: 'linear-gradient(180deg, #f0f7f2 0%, #e6efe8 100%)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '20px',
              position: 'relative',
              cursor: 'crosshair',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 10px rgba(33, 64, 47, 0.05)'
            }}>
              <canvas
                ref={bubbleCanvasRef}
                onClick={handleBubbleClick}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setPoppedCount(0)}
                className="btn-ghost"
                style={{ padding: '8px 20px', fontSize: '0.82rem' }}
              >
                Reset Counter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
