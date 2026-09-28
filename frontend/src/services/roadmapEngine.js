// ============================================
// MindCare — Personalized Therapy Roadmap Engine
// Generates CBT, somatic & mindfulness pathways tailored to logged history
// ============================================

export function generateTherapyRoadmap(userData, journalEntries = []) {
  const moods = userData?.moodHistory || [];
  const moodNames = moods.map(m => m.mood);
  const anxiousCount = moodNames.filter(m => m === 'anxious' || m === 'stressed').length;
  const sadCount = moodNames.filter(m => m === 'sad' || m === 'tired').length;
  const calmCount = moodNames.filter(m => m === 'calm' || m === 'happy').length;
  const journalCount = journalEntries.length;

  // Determine current primary therapy track
  let primaryTrack = 'Equilibrium & Nervous System Regulation';
  let trackDescription = 'Grounding techniques designed to soothe autonomic nervous system reactivity.';
  let trackColor = '#4db8a8';

  if (anxiousCount > sadCount && anxiousCount >= 2) {
    primaryTrack = 'Anxiety Relief & Cognitive De-Catastrophizing';
    trackDescription = 'Cognitive Behavioral Therapy (CBT) protocols to unhook from catastrophic loops and panic responses.';
    trackColor = '#6ec6e6';
  } else if (sadCount > anxiousCount && sadCount >= 2) {
    primaryTrack = 'Behavioral Activation & Self-Compassion';
    trackDescription = 'Gentle incremental activation protocols to lift depressive lethargy and foster self-kindness.';
    trackColor = '#8aa9c4';
  } else if (calmCount >= 3) {
    primaryTrack = 'Resilience & Deep Mindfulness Mastery';
    trackDescription = 'Advanced reflective practices to solidify emotional durability and mindful presence.';
    trackColor = '#88d8b0';
  }

  // Milestones based on track
  const milestones = [
    {
      id: 'm1',
      stage: 'Phase 1: Somatic Awareness',
      title: 'Physiological Sigh & Body Grounding',
      description: 'Master autonomic down-regulation by completing 3 synchronized breathing sessions.',
      duration: '3–5 mins',
      progress: Math.min(100, Math.round((moods.length / 3) * 100)),
      status: moods.length >= 3 ? 'completed' : 'in-progress',
      icon: '🌬️',
      cbtTechnique: 'Vagal Nerve Activation',
      route: '/breathing'
    },
    {
      id: 'm2',
      stage: 'Phase 2: Cognitive Reframing',
      title: 'Thought Distortion Recognition',
      description: 'Capture internal inner monologues in the journal and test if thoughts are absolute truths.',
      duration: '5–10 mins',
      progress: Math.min(100, Math.round((journalCount / 2) * 100)),
      status: journalCount >= 2 ? 'completed' : moods.length >= 2 ? 'in-progress' : 'locked',
      icon: '✍️',
      cbtTechnique: 'Cognitive Restructuring (Beck Protocol)',
      route: '/journal'
    },
    {
      id: 'm3',
      stage: 'Phase 3: Habit & Emotional Anchoring',
      title: 'Micro-Routine Resilience',
      description: 'Establish 3 consecutive days of morning mood check-ins and restorative habits.',
      duration: 'Daily',
      progress: Math.min(100, Math.round(((userData?.streak || 1) / 3) * 100)),
      status: (userData?.streak || 1) >= 3 ? 'completed' : 'in-progress',
      icon: '🌱',
      cbtTechnique: 'Behavioral Reinforcement',
      route: '/routine'
    },
    {
      id: 'm4',
      stage: 'Phase 4: Emotional Mastery',
      title: 'Long-term Coping Toolkit',
      description: 'Maintain an updated personal safety and self-soothing emergency plan.',
      duration: 'Ongoing',
      progress: 75,
      status: 'in-progress',
      icon: '🛡️',
      cbtTechnique: 'Safety & Coping Resource Consolidation',
      route: '/crisis'
    }
  ];

  return {
    primaryTrack,
    trackDescription,
    trackColor,
    milestones,
    tailoredTips: [
      anxiousCount >= 1 ? 'Notice physical jaw clenching or shoulder tension before anxious thoughts start.' : null,
      sadCount >= 1 ? 'Action precedes motivation — do the first 60 seconds of any task without expecting perfection.' : null,
      'Consistency matters far more than duration: 2 calm minutes beats 30 forced minutes.'
    ].filter(Boolean)
  };
}
