// ============================================
// MindCare Sanctuary — Interactive 3D Tilt Card (Scratch-Built)
// Clean, light, scratch-built physics tilt with pointer tracking,
// specular highlight, and strict prefers-reduced-motion fallback
// ============================================

import React, { useState, useRef, useEffect } from 'react';

export default function TiltCard({
  children,
  className = '',
  style = {},
  maxTilt = 8,
  glare = true
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, isHovered: false });
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
    if (isReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTransform({
      rotateX: Number(rotateX.toFixed(2)),
      rotateY: Number(rotateY.toFixed(2)),
      glareX: Number(glareX.toFixed(1)),
      glareY: Number(glareY.toFixed(1)),
      isHovered: true
    });
  };

  const handleMouseLeave = () => {
    setTransform(prev => ({ ...prev, rotateX: 0, rotateY: 0, isHovered: false }));
  };

  return (
    <div
      ref={cardRef}
      className={`sanctuary-card-container ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: isReducedMotion ? 'none' : '1000px',
        transformStyle: isReducedMotion ? 'flat' : 'preserve-3d',
        position: 'relative',
        borderRadius: '24px',
        transform: isReducedMotion
          ? (transform.isHovered ? 'translateY(-3px)' : 'translateY(0)')
          : (transform.isHovered
              ? `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) translateY(-4px)`
              : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)'),
        boxShadow: transform.isHovered
          ? '0 18px 45px rgba(33, 64, 47, 0.09), 0 4px 14px rgba(33, 64, 47, 0.03)'
          : '0 8px 24px rgba(33, 64, 47, 0.04), 0 2px 6px rgba(33, 64, 47, 0.02)',
        transition: transform.isHovered
          ? 'transform 0.12s ease-out, box-shadow 0.25s ease'
          : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease',
        ...style
      }}
    >
      {children}
      {glare && !isReducedMotion && transform.isHovered && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            background: `radial-gradient(circle at ${transform.glareX}% ${transform.glareY}%, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0) 65%)`,
            mixBlendMode: 'overlay',
            transition: 'opacity 0.2s ease'
          }}
        />
      )}
    </div>
  );
}
