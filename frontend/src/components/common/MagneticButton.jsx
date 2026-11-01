// ============================================
// MindCare Sanctuary — Magnetic Button Component (Scratch-Built)
// Unhurried physical pull effect for primary buttons with
// automatic prefers-reduced-motion deactivation
// ============================================

import React, { useRef, useState, useEffect } from 'react';

export default function MagneticButton({
  children,
  className = '',
  style = {},
  strength = 0.22,
  maxOffset = 8,
  onClick,
  ...props
}) {
  const btnRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
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

  const handleMouseMove = (e) => {
    if (isReducedMotion || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);

    const pullX = Math.max(-maxOffset, Math.min(maxOffset, relX * strength));
    const pullY = Math.max(-maxOffset, Math.min(maxOffset, relY * strength));
    setOffset({ x: pullX, y: pullY });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <button
      ref={btnRef}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isReducedMotion ? 'none' : `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: offset.x === 0 && offset.y === 0
          ? 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease'
          : 'transform 0.1s ease-out, box-shadow 0.25s ease',
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
}
