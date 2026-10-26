// ============================================
// MindCare Sanctuary — Questionnaire Configuration
// Single source of truth for:
// - Fixed 8 questions (no adaptive branching)
// - Fixed 0–3 scoring scale per question
// - Low / Moderate / High score bands & thresholds
// Designed for Young Adults (Ages 20–25)
// ============================================

export const QUESTIONNAIRE_CONFIG = {
  version: '2.0',
  targetAudience: '20-25',
  scale: [
    { value: 0, label: 'Not at all / Rare', detail: 'Mind and body feel spacious and steady' },
    { value: 1, label: 'Several times / Mild', detail: 'Noticeable on some days, manageable' },
    { value: 2, label: 'Often / Noticeable burden', detail: 'Frequently disrupts focus or rest' },
    { value: 3, label: 'Almost constantly / Exhausting', detail: 'Consistently heavy and overwhelming' }
  ],
  questions: [
    {
      id: 'q1',
      category: 'energy',
      question: 'Over the past few days, how often have you felt drained or running on empty before your day is over?',
      helper: 'Reflecting on mental clarity, physical vitality, and morning fatigue.'
    },
    {
      id: 'q2',
      category: 'nervous_tension',
      question: 'How frequently do racing thoughts, deadlines, or future worries interrupt your calm?',
      helper: 'Noticing mental loops, catastrophizing, or feeling restless inside.'
    },
    {
      id: 'q3',
      category: 'relaxation',
      question: 'When you take a pause to relax, how hard is it to let your shoulders drop and feel at ease?',
      helper: 'Bodily tension, jaw clenching, or an autonomic feeling of being on guard.'
    },
    {
      id: 'q4',
      category: 'sleep_restoration',
      question: 'How disrupted or unrefreshing has your sleep and nighttime wind-down felt lately?',
      helper: 'Difficulty falling asleep, waking up exhausted, or screen scrolling loops.'
    },
    {
      id: 'q5',
      category: 'enthusiasm',
      question: 'How often have you felt unmotivated or disconnected from activities you normally look forward to?',
      helper: 'Emotional fatigue, apathy, or feeling like you are just going through the motions.'
    },
    {
      id: 'q6',
      category: 'focus',
      question: 'How much has mental fog, scattered attention, or digital overload weighed on your tasks?',
      helper: 'Trouble sustaining focus without needing constant stimulation or breaks.'
    },
    {
      id: 'q7',
      category: 'emotional_resilience',
      question: 'When unexpected hiccups occur, how easily do you feel overwhelmed or on edge?',
      helper: 'Emotional threshold, sensitivity, or feeling like the next small thing will tip you over.'
    },
    {
      id: 'q8',
      category: 'self_compassion',
      question: 'How frequently does your inner voice speak harshly to you about your progress or choices?',
      helper: 'Self-criticism, comparison with peers, or feeling you are never doing enough.'
    }
  ],
  bands: [
    {
      id: 'low',
      minScore: 0,
      maxScore: 7,
      title: 'Steady Rhythm',
      subtitle: 'Steady baseline resilience with room for restorative grounding.',
      badge: 'Steady State',
      themeColor: '#52b788',
      summary: 'Your emotional rhythm shows solid coping capacity. Daily micro-moments of mindful focus and sensory awareness will nurture this foundation.',
      recommendedTherapist: {
        category: 'Wellness Counselor & Mindfulness Practitioner',
        subtitle: 'Recommended for proactive resilience, focus cultivation, and balanced daily habits',
        focusAreas: ['Stress resilience', 'Focus and routine building', 'Burnout prevention', 'Work-study balance'],
        modality: 'Solution-Focused Brief Practice (SFBT) & Mindfulness-Based Stress Reduction (MBSR)',
        cadence: 'Bi-weekly check-ins or as-needed guidance',
        rationale: 'Your score reflects healthy baseline resilience with manageable everyday stress. A wellness counselor provides supportive, structured accountability to sustain your well-being without requiring clinical diagnostic treatment.'
      },
      recommendations: {
        games: [
          { title: 'Zen Garden Ripple Focus', desc: 'Rake calming patterns and cultivate spatial stillness.', route: '/games' },
          { title: 'Sensory Ripple Focus', desc: 'Gentle tactile taps that soothe attention.', route: '/games' }
        ],
        breathing: [
          { title: 'Balanced Resonance Breath (5.5s)', desc: 'Optimizes heart rate variability and mental presence.', route: '/breathing' }
        ],
        meditation: [
          { title: '10-Minute Morning Forest Solitude', desc: 'Grounding visualization amidst ancient pine and cedar.' }
        ],
        yoga: [
          { title: 'Light Spinal Awakening & Cat-Cow Flow', desc: 'Unwinds desk stiffness and restores posture.' }
        ],
        music: [
          { title: 'Gentle Acoustic Harmony & Natural Warmth', desc: '432Hz natural frequency warmth.' }
        ]
      }
    },
    {
      id: 'moderate',
      minScore: 8,
      maxScore: 15,
      title: 'Rest & Reset',
      subtitle: 'Accumulated stress or fatigue calling for intentional relief.',
      badge: 'Rest & Reset',
      themeColor: '#d97706',
      summary: 'You have been carrying a noticeable load between career, studies, and personal transitions. Let us soothe physical tension and soften mental urgency.',
      recommendedTherapist: {
        category: 'Licensed Clinical Psychologist (CBT & ACT Specialist)',
        subtitle: 'Recommended for cognitive loop defusion, nervous tension, and emotional fatigue',
        focusAreas: ['Overthinking & worry cycles', 'Performance and study pressure', 'Somatic tension & sleep quality', 'Emotional overwhelm'],
        modality: 'Cognitive Behavioral Therapy (CBT) & Acceptance and Commitment Therapy (ACT)',
        cadence: 'Weekly structured therapy sessions',
        rationale: 'Your score indicates accumulated emotional tension and persistent fatigue. A clinical psychologist trained in CBT and ACT can guide you with proven cognitive tools to unhook from worry loops, regulate somatic tension, and restore restorative rest.'
      },
      recommendations: {
        games: [
          { title: 'Color Harmony & Hue Gradient Flow', desc: 'Cognitive grounding that eases racing thoughts.', route: '/games' },
          { title: 'Thought Defusion Zen Rake', desc: 'Symbolically release unhelpful worry loops.', route: '/games' }
        ],
        breathing: [
          { title: '4-7-8 Parasympathetic Down-Regulation', desc: 'Vagal nerve activation to drop adrenaline.', route: '/breathing' }
        ],
        meditation: [
          { title: 'Body Scan & Shoulder Softening Journey', desc: 'Release unconscious somatic holding patterns.' }
        ],
        yoga: [
          { title: 'Restorative Child’s Pose & Hip Unwind', desc: 'Releases stored cortisol from lower back and hips.' }
        ],
        music: [
          { title: 'Binaural Delta Waves with Soft Rain', desc: 'Slows brainwaves from beta to peaceful alpha-theta.' }
        ]
      }
    },
    {
      id: 'high',
      minScore: 16,
      maxScore: 24,
      title: 'Care & Comfort',
      subtitle: 'High emotional load; gentle somatic ease and professional care ready.',
      badge: 'Gentle Support',
      themeColor: '#b91c1c',
      summary: 'Things feel heavy, overwhelming, or deeply draining right now. You do not have to carry this alone. MindCare prioritizes urgent nervous system soothing alongside access to dedicated professional guidance.',
      recommendedTherapist: {
        category: 'Senior Clinical Psychologist / Psychiatrist',
        subtitle: 'Recommended for compassionate clinical evaluation, trauma-informed care, and acute emotional relief',
        focusAreas: ['Acute emotional distress', 'Severe exhaustion & burnout', 'Depressive fatigue or panic surges', 'Comprehensive mental health assessment'],
        modality: 'Trauma-Informed Psychotherapy & Comprehensive Clinical Diagnostics',
        cadence: 'Priority consultation & comprehensive care pathway',
        rationale: 'Your responses reflect substantial emotional burden and nervous system strain. Consulting a senior clinical psychologist or psychiatrist provides a safe, non-judgmental space with specialized clinical care, ensuring you have the deepest support and an individual recovery roadmap.'
      },
      recommendations: {
        games: [
          { title: 'Gentle Flowing Water Sandbox', desc: 'Zero pressure, meditative kinetic relaxation.', route: '/games' }
        ],
        breathing: [
          { title: 'Box Breathing (4-4-4-4 Square Respiration)', desc: 'Proven autonomic stabilization for acute surge.', route: '/breathing' }
        ],
        meditation: [
          { title: '5-4-3-2-1 Sensory Safety Grounding', desc: 'Anchors your mind safely into the physical present.' }
        ],
        yoga: [
          { title: 'Legs-Up-The-Wall Restorative Pose', desc: 'Promotes rapid circulatory down-regulation and deep relaxation.' }
        ],
        music: [
          { title: '528Hz Solfeggio Deep Peace Sanctuary', desc: 'Subtle harmonic frequency to nurture self-compassion.' }
        ]
      }
    }
  ]
};

export function getBandForScore(totalScore) {
  const score = Math.max(0, Math.min(24, Number(totalScore) || 0));
  return QUESTIONNAIRE_CONFIG.bands.find(b => score >= b.minScore && score <= b.maxScore) || QUESTIONNAIRE_CONFIG.bands[1];
}

export const SCORE_BAND_TITLES = {
  low: 'Steady Rhythm',
  moderate: 'Rest & Reset',
  high: 'Care & Comfort'
};
