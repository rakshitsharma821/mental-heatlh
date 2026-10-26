// ============================================
// MindCare Sanctuary — Interactive Card
// Clean, professional, grounded UI (no 3D slope / perspective distortion)
// ============================================

import React, { useState } from 'react';

export default function TiltCard({
  children,
  className = '',
  style = {}
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`sanctuary-card-container ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 12px 28px rgba(0, 0, 0, 0.08)' : '0 4px 16px rgba(0, 0, 0, 0.03)',
        transition: 'transform 0.22s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.22s ease',
        ...style
      }}
    >
      {children}
    </div>
  );
}
