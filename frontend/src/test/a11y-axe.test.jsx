// ============================================
// MindCare Sanctuary — Automated Accessibility (axe-core) Audit
// Scans Landing, Login, Questionnaire, Recommendations
// Checks for WCAG AA compliance & contrast violations
// ============================================

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { AuthProvider } from '../context/AuthContext';

import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Questionnaire from '../pages/Questionnaire';
import Recommendations from '../pages/Recommendations';

function renderWithProviders(ui, initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Automated Accessibility (axe-core) Audit', () => {
  it('Landing page accessibility audit', async () => {
    const { container } = renderWithProviders(<Landing />, '/');
    const results = await axe.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
      }
    });

    console.log('LANDING A11Y VIOLATIONS:', results.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description })));
    // We expect zero critical violations
    const criticalViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(criticalViolations.length).toBe(0);
  });

  it('Login page accessibility audit', async () => {
    const { container } = renderWithProviders(<Login />, '/login');
    const results = await axe.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
      }
    });

    console.log('LOGIN A11Y VIOLATIONS:', results.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description })));
    const criticalViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(criticalViolations.length).toBe(0);
  });

  it('Questionnaire page accessibility audit', async () => {
    const { container } = renderWithProviders(<Questionnaire />, '/questionnaire');
    const results = await axe.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
      }
    });

    console.log('QUESTIONNAIRE A11Y VIOLATIONS:', results.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description })));
    const criticalViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(criticalViolations.length).toBe(0);
  });

  it('Recommendations page accessibility audit', async () => {
    const { container } = renderWithProviders(<Recommendations />, '/recommendations');
    const results = await axe.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
      }
    });

    console.log('RECOMMENDATIONS A11Y VIOLATIONS:', results.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description })));
    const criticalViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(criticalViolations.length).toBe(0);
  });
});
