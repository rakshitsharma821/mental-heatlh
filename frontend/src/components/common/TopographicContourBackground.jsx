// ============================================
// MindCare Sanctuary — Ambient Topographic Contour Lines
// Faint, organic contour strokes drifting slowly in the background
// Completely static when prefers-reduced-motion is active
// ============================================

import React, { useState, useEffect } from 'react';

export default function TopographicContourBackground() {
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

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85
      }}
    >
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{
          width: '100%',
          height: '100%',
          animation: isReducedMotion ? 'none' : 'contourDrift 42s ease-in-out infinite alternate',
          transformOrigin: 'center center'
        }}
      >
        <path
          d="M-100 200 C 240 120, 520 280, 800 180 C 1080 80, 1320 240, 1600 150"
          stroke="rgba(53, 114, 85, 0.065)"
          strokeWidth="1.5"
          strokeDasharray="4 8"
        />
        <path
          d="M-80 320 C 280 220, 560 380, 840 290 C 1120 200, 1360 340, 1620 260"
          stroke="rgba(53, 114, 85, 0.08)"
          strokeWidth="1.8"
        />
        <path
          d="M-60 440 C 300 360, 600 500, 900 400 C 1200 300, 1400 460, 1640 380"
          stroke="rgba(82, 183, 136, 0.075)"
          strokeWidth="1.6"
        />
        <path
          d="M-120 580 C 220 500, 540 640, 860 540 C 1180 440, 1380 600, 1660 520"
          stroke="rgba(107, 163, 199, 0.07)"
          strokeWidth="1.8"
        />
        <path
          d="M-100 720 C 260 640, 580 780, 920 680 C 1240 580, 1420 740, 1680 660"
          stroke="rgba(157, 132, 183, 0.065)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        <path
          d="M-50 840 C 320 760, 640 880, 980 800 C 1300 720, 1460 860, 1700 780"
          stroke="rgba(53, 114, 85, 0.075)"
          strokeWidth="1.6"
        />
      </svg>
      <style>{`
        @keyframes contourDrift {
          0% {
            transform: scale(1) translate(0px, 0px) rotate(0deg);
          }
          50% {
            transform: scale(1.03) translate(14px, -18px) rotate(0.4deg);
          }
          100% {
            transform: scale(1.01) translate(-16px, 12px) rotate(-0.3deg);
          }
        }
      `}</style>
    </div>
  );
}
