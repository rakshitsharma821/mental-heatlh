// ============================================
// MindCare Sanctuary — Breathing Patterns Configuration
// Centralized Single Source of Truth for Somatic Respiration Timings
// ============================================

export const BREATHING_PATTERNS = {
  '478': {
    id: '478',
    name: '4-7-8 Deep Relaxation',
    description: 'Activates parasympathetic vagal tone to quiet adrenaline and racing thoughts.',
    phases: [
      { name: 'Inhale', duration: 4, tip: 'Breathe gently in through the nose' },
      { name: 'Hold', duration: 7, tip: 'Retain the breath with soft stillness' },
      { name: 'Exhale', duration: 8, tip: 'Release fully through parted lips with a slow sigh' }
    ]
  },
  'box': {
    id: 'box',
    name: 'Box Breathing (4-4-4-4)',
    description: 'Stabilizes heart rate variability and enhances grounded clarity and focus.',
    phases: [
      { name: 'Inhale', duration: 4, tip: 'Fill lungs smoothly and evenly' },
      { name: 'Hold', duration: 4, tip: 'Maintain calm stillness at full expansion' },
      { name: 'Exhale', duration: 4, tip: 'Empty lungs with steady control' },
      { name: 'Hold', duration: 4, tip: 'Pause softly at stillness' }
    ]
  },
  'resonance': {
    id: 'resonance',
    name: 'Balanced 5.5s Resonance',
    description: 'HRV coherent breathing at ~5.5 breaths per minute for deep autonomic balance.',
    phases: [
      { name: 'Inhale', duration: 5.5, tip: 'Slow, expansive diaphragmatic breath' },
      { name: 'Exhale', duration: 5.5, tip: 'Smooth, unbroken surrender of breath' }
    ]
  }
};

export const DEFAULT_BREATHING_PATTERN_KEY = '478';
