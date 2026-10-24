// ============================================
// MindCare Sanctuary — Frontend Smoke & Verification Suite
// Tests:
// 1. Static dist-free rules: no <canvas> and no custom cursor on /login, /register, /questionnaire
// 2. Motion safety: zero WebGL canvases mounted when prefers-reduced-motion is active
// 3. Smoke test: Landing, Welcome, Dashboard, Breathing, Recommendations mount without console errors
// ============================================

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

// Pages to test
import Login from '../pages/Login';
import Register from '../pages/Register';
import Questionnaire from '../pages/Questionnaire';
import Landing from '../pages/Landing';
import Welcome from '../pages/Welcome';
import Dashboard from '../pages/Dashboard';
import Breathing from '../pages/Breathing';
import Recommendations from '../pages/Recommendations';

// 3D Canvas components
import BreathingOrbCanvas from '../components/three/BreathingOrbCanvas';
import InnerWorldCanvas from '../components/three/InnerWorldCanvas';
import CalmBrainHero from '../components/three/CalmBrainHero';

function renderWithProviders(ui, initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('1. Static Distraction-Free Flow Tests (Zero Canvases, Zero Custom Cursors)', () => {
  it('Login page has NO <canvas> element and NO custom cursor element', () => {
    const { container } = renderWithProviders(<Login />, '/login');
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(0);

    const customCursor = container.querySelector('.sanctuary-cursor-ring, .custom-cursor, #custom-cursor');
    expect(customCursor).toBeNull();
  });

  it('Register page has NO <canvas> element and NO custom cursor element', () => {
    const { container } = renderWithProviders(<Register />, '/register');
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(0);

    const customCursor = container.querySelector('.sanctuary-cursor-ring, .custom-cursor, #custom-cursor');
    expect(customCursor).toBeNull();
  });

  it('Questionnaire page has NO <canvas> element and NO custom cursor element', () => {
    const { container } = renderWithProviders(<Questionnaire />, '/questionnaire');
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(0);

    const customCursor = container.querySelector('.sanctuary-cursor-ring, .custom-cursor, #custom-cursor');
    expect(customCursor).toBeNull();
  });
});

describe('2. Reduced Motion & Sensory Comfort Tests (Zero WebGL when reduced-motion active)', () => {
  beforeEach(() => {
    localStorage.setItem('mindcare_reduce_motion', 'true');
  });

  afterEach(() => {
    localStorage.removeItem('mindcare_reduce_motion');
  });

  it('BreathingOrbCanvas mounts static fallback and NO <canvas> when reduce-motion is set', () => {
    const { container } = render(<BreathingOrbCanvas size="compact" />);
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(0);

    const fallback = container.querySelector('.breathing-orb-fallback');
    expect(fallback).not.toBeNull();
  });

  it('InnerWorldCanvas mounts static fallback and NO <canvas> when reduce-motion is set', () => {
    const { container } = render(<InnerWorldCanvas mode="panel" />);
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(0);

    const titleEl = container.querySelector('[title="Sanctuary Garden (Static Mode)"]');
    expect(titleEl).not.toBeNull();
  });

  it('CalmBrainHero mounts static fallback and NO <canvas> when reduce-motion is set', () => {
    const { container } = render(<CalmBrainHero />);
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(0);

    const fallback = container.querySelector('.calm-brain-hero-fallback');
    expect(fallback).not.toBeNull();
  });
});

describe('3. Page Mount Smoke Tests (Clean mount without console errors)', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('Landing page mounts cleanly', () => {
    const { container } = renderWithProviders(<Landing />, '/');
    expect(container).toBeDefined();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('Welcome page mounts cleanly', () => {
    const { container } = renderWithProviders(<Welcome />, '/welcome');
    expect(container).toBeDefined();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('Dashboard page mounts cleanly', () => {
    const { container } = renderWithProviders(<Dashboard />, '/dashboard');
    expect(container).toBeDefined();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('Breathing page mounts cleanly', () => {
    const { container } = renderWithProviders(<Breathing />, '/breathing');
    expect(container).toBeDefined();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('Recommendations page mounts cleanly', () => {
    const { container } = renderWithProviders(<Recommendations />, '/recommendations');
    expect(container).toBeDefined();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
