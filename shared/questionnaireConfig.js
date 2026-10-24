// ============================================
// MindCare Sanctuary — Questionnaire Configuration (Shared)
// Single Source of Truth for:
// - Fixed 8 questions (no branching)
// - Fixed 0-3 scale per question
// - Young Adult focus (Ages 20-25)
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
      category: 'groundedness',
      question: 'How present, centered, and physically safe have you felt in your everyday surroundings?',
      helper: 'Mindfulness baseline, somatic grounding, and feelings of inner security.'
    }
  ]
};
