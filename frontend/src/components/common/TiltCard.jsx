// ============================================
// MindCare Sanctuary — Interactive 3D Tilt Card
// CSS Perspective Transform (Zero WebGL overhead)
// Smooth mouse tracking, subtle light reflection, and reduced-motion awareness
// ============================================

import React, { useRef, useState } from 'react';

export default function TiltCard({
  children,
  className = '',
  style = {},
  maxTilt = 7, // Maximum tilt angle in degrees
  glare = true
}) {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState('');
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransformStyle(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.16
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)');
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-card-container ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: transformStyle,
        transition: 'transform 0.22s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.22s ease',
        ...style
      }}
    >
      {children}

      {/* Subtle Specular Glare Reflection */}
      {glare && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 65%)`,
            opacity: glarePosition.opacity,
            pointerEvents: 'none',
            transition: 'opacity 0.25s ease',
            zIndex: 3
          }}
        />
      )}
    </div>
  );
}
