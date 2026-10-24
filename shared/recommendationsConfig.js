// ============================================
// MindCare Sanctuary — Recommendations Configuration (Shared)
// Single Source of Truth for Activity Recommendations per Score Band
// ============================================

export const RECOMMENDATIONS_CONFIG = {
  low: {
    band: 'low',
    title: 'Steady Rhythm',
    themeColor: '#52b788',
    summary: 'Steady baseline resilience with room for restorative grounding.',
    activities: {
      games: [
        { title: 'Zen Garden Sand Drawing', desc: 'Rake calming patterns and cultivate spatial stillness.', route: '/games', icon: '🎋' },
        { title: 'Sensory Ripple Focus', desc: 'Gentle tactile taps that soothe attention.', route: '/games', icon: '🫧' }
      ],
      breathing: [
        { title: 'Balanced Resonance Breath (5.5s)', desc: 'Optimizes heart rate variability and mental presence.', route: '/breathing', icon: '🌬️' }
      ],
      meditation: [
        { title: '10-Minute Morning Forest Solitude', desc: 'Grounding visualization amidst ancient pine and cedar.', icon: '🌲' }
      ],
      yoga: [
        { title: 'Light Spinal Awakening & Cat-Cow Flow', desc: 'Unwinds desk stiffness and restores posture.', icon: '🧘' }
      ],
      music: [
        { title: 'Gentle Acoustic Guitar & Birdsong Harmony', desc: '432Hz natural frequency warmth.', icon: '🎵' }
      ]
    }
  },
  moderate: {
    band: 'moderate',
    title: 'Rest & Reset',
    themeColor: '#d97706',
    summary: 'Accumulated stress or fatigue calling for intentional relief.',
    activities: {
      games: [
        { title: 'Color Harmony & Hue Gradient Flow', desc: 'Cognitive grounding that eases racing thoughts.', route: '/games', icon: '🎨' },
        { title: 'Thought Defusion Zen Rake', desc: 'Symbolically release unhelpful worry loops.', route: '/games', icon: '🌿' }
      ],
      breathing: [
        { title: '4-7-8 Parasympathetic Down-Regulation', desc: 'Vagal nerve activation to drop adrenaline.', route: '/breathing', icon: '🍃' }
      ],
      meditation: [
        { title: 'Body Scan & Shoulder Softening Journey', desc: 'Release unconscious somatic holding patterns.', icon: '🌊' }
      ],
      yoga: [
        { title: 'Restorative Child’s Pose & Hip Unwind', desc: 'Releases stored cortisol from lower back and hips.', icon: '🧘' }
      ],
      music: [
        { title: 'Warm Rain on Cedar Shingles & Low Binaural Drift', desc: 'Delta-wave relaxation frequencies.', icon: '🌧️' }
      ]
    }
  },
  high: {
    band: 'high',
    title: 'Care & Comfort',
    themeColor: '#b91c1c',
    summary: 'High emotional load; gentle somatic ease and professional care ready.',
    activities: {
      games: [
        { title: 'Breathing Bubble Sync (Ultra Gentle)', desc: 'Follow the rhythm with zero performance score or timer.', route: '/games', icon: '🫧' }
      ],
      breathing: [
        { title: 'Physiological Sigh (Double Inhale, Long Sigh Out)', desc: 'Immediate neurological reset for acute nervous arousal.', route: '/breathing', icon: '🫁' }
      ],
      meditation: [
        { title: 'Compassionate Self-Holding & Sanctuary Visualization', desc: 'Warm safety anchor without intrusive prompt demands.', icon: '🕊️' }
      ],
      yoga: [
        { title: 'Legs-Up-The-Wall (Viparita Karani) Supported Rest', desc: 'Direct autonomic brake on sympathetic nervous system.', icon: '🛋️' }
      ],
      music: [
        { title: 'Deep Ambient Drone & 528Hz Solfeggio Resonance', desc: 'Soothing grounding soundscape.', icon: '🎶' }
      ]
    }
  }
};
