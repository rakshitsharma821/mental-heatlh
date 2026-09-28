// ============================================
// MindCare — AI Wellness Coach Daily Plan Generator
// Tailors a realistic 4-step daily rhythm based on recent activity
// ============================================

export function generateDailyPlan(userData, journalEntries = []) {
  const moods = userData?.moodHistory || [];
  const latestMood = moods.length > 0 ? moods[moods.length - 1]?.mood : 'calm';

  let breathingFocus = {
    title: '4-7-8 Deep Relaxation Breath',
    duration: '3 min',
    reason: 'Soothes nervous system and lowers evening adrenaline',
    route: '/breathing'
  };

  let journalPrompt = {
    title: 'Daily Micro-Journal',
    prompt: 'What is one gentle kindness you can offer yourself today?',
    reason: 'Fosters self-compassion and mental space',
    route: '/journal'
  };

  let mindfulBreak = {
    title: 'Sensory Decompression Pause',
    detail: 'Step away from screens for 2 minutes. Notice 3 physical sensations around you.',
    reason: 'Prevents cognitive fatigue buildup',
    route: '/games'
  };

  let restorativeHabit = {
    title: 'Hydration & Posture Reset',
    detail: 'Drink a glass of water slowly and roll your shoulders back 3 times.',
    reason: 'Physical posture directly signals physical safety to the brain'
  };

  // Personalize based on latest mood
  if (latestMood === 'anxious' || latestMood === 'stressed') {
    breathingFocus = {
      title: 'Box Breathing (Square Respiration)',
      duration: '4 min',
      reason: 'Proven to lower heart rate variability during stress surges',
      route: '/breathing'
    };
    journalPrompt = {
      title: 'Thought Defusion Journal',
      prompt: 'Write down what is feeling urgent right now. Is it truly urgent, or just loud?',
      reason: 'Distinguishes between perceived crisis and reality',
      route: '/journal'
    };
    mindfulBreak = {
      title: 'StressBurst Interactive Decompression',
      detail: 'Pop 20 calming bubbles to release tactile kinetic stress.',
      reason: 'Engages kinetic sensory grounding to interrupt anxiety loops',
      route: '/games'
    };
  } else if (latestMood === 'sad' || latestMood === 'tired') {
    breathingFocus = {
      title: 'Gentle Calming Flow',
      duration: '3 min',
      reason: 'Restores gentle oxygen flow without demanding high effort',
      route: '/breathing'
    };
    journalPrompt = {
      title: 'Gentle Anchor Reflection',
      prompt: 'What is something simple that felt comforting or safe recently?',
      reason: 'Gently engages positive recall without forced optimism',
      route: '/journal'
    };
    restorativeHabit = {
      title: 'Warmth & Rest Permission',
      detail: 'Allow yourself 10 minutes of quiet rest with zero productivity pressure.',
      reason: 'Rest without guilt accelerates emotional recovery'
    };
  } else if (latestMood === 'happy' || latestMood === 'excited') {
    journalPrompt = {
      title: 'Savoring & Joy Anchoring',
      prompt: 'What sparked joy or relief today? How can you remember this feeling?',
      reason: 'Anchoring positive emotional memories builds long-term resilience',
      route: '/journal'
    };
    breathingFocus = {
      title: 'Energizing Harmonic Breath',
      duration: '3 min',
      reason: 'Grounds excitement into clear, sustained vitality',
      route: '/breathing'
    };
  }

  return [
    {
      id: 'step-1-breath',
      category: 'Breathwork',
      icon: '🌬️',
      title: breathingFocus.title,
      subtitle: `${breathingFocus.duration} • ${breathingFocus.reason}`,
      route: breathingFocus.route,
      completed: false
    },
    {
      id: 'step-2-journal',
      category: 'Reflection',
      icon: '✍️',
      title: journalPrompt.title,
      subtitle: `Prompt: "${journalPrompt.prompt}"`,
      route: journalPrompt.route,
      completed: false
    },
    {
      id: 'step-3-break',
      category: 'Mindful Pause',
      icon: '🫧',
      title: mindfulBreak.title,
      subtitle: `${mindfulBreak.detail}`,
      route: mindfulBreak.route,
      completed: false
    },
    {
      id: 'step-4-habit',
      category: 'Nourishment',
      icon: '🌿',
      title: restorativeHabit.title,
      subtitle: `${restorativeHabit.detail}`,
      completed: false
    }
  ];
}
