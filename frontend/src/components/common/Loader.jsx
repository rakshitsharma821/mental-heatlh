import React from 'react';

export default function Loader({ message = 'Inhale slowly...' }) {
  return (
    <div className="sanctuary-loader-container">
      <div className="sanctuary-loader-rings">
        <div className="loader-ring ring-1"></div>
        <div className="loader-ring ring-2"></div>
        <div className="loader-ring ring-3"></div>
        <div className="loader-center-orb"></div>
      </div>
      <p className="loader-text">{message}</p>
    </div>
  );
}
