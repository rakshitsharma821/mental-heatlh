// ============================================
// MindCare — AI Sanctuary Companion Engine
// Cross-session memory, tone adaptation, proactive milestones, safety guard
// ============================================

import { Storage } from './storage';

// Crisis trigger patterns
const CRISIS_KEYWORDS = [
  /suicid/i, /kill myself/i, /want to die/i, /end my life/i, /self harm/i,
  /hurt myself/i, /can't go on/i, /no reason to live/i, /better off dead/i
];

export class SanctuaryCompanion {
  constructor(user) {
    this.user = user;
    this.name = 'Aria'; // Gentle companion name
  }

  // Detect proactive milestones to warmly greet the user
  getProactiveMilestoneGreeting() {
    const user = this.user || Storage.getCurrentUser();
    const streak = user?.streak || 1;
    const moods = user?.moodHistory || [];
    const journals = Storage.getJournalEntries();
    const routines = Storage.getRoutines();
    const completedRoutines = routines.filter(r => r.completed).length;

    // Check recent mood
    const latestMood = moods.length > 0 ? moods[moods.length - 1].mood : null;

    if (streak >= 5) {
      return `Welcome back, ${user?.name || 'friend'} 🌿 I noticed you've kept a ${streak}-day sanctuary streak! That consistency is a genuine gift you are giving yourself. How are you feeling in this moment?`;
    }

    if (journals.length >= 3) {
      return `Hello, ${user?.name || 'friend'}. You've written ${journals.length} reflective journals recently. Giving words to your inner world takes real courage. What's on your mind today?`;
    }

    if (completedRoutines > 0) {
      return `Good to see you, ${user?.name || 'friend'} 🌸 You've already cared for ${completedRoutines} of your daily wellness habits today. Let's take a slow breath together. How can I support you right now?`;
    }

    if (latestMood === 'anxious' || latestMood === 'stressed') {
      return `Hello, ${user?.name || 'friend'}. I noticed your recent check-in mentioned feeling ${latestMood}. Remember, there is nothing you need to fix or perform here. This is your safe space to breathe.`;
    }

    return `Welcome to your sanctuary, ${user?.name || 'friend'}. I'm Aria, your gentle wellness companion. I remember your journey and I'm here whenever you need a grounded, quiet space to reflect. How does your body feel right now?`;
  }

  // Determine emotional tone based on user history
  getUserToneProfile() {
    const user = this.user || Storage.getCurrentUser();
    const moods = user?.moodHistory || [];
    if (moods.length === 0) return 'gentle_neutral';

    const recent = moods.slice(-3).map(m => m.mood);
    const hasStress = recent.includes('anxious') || recent.includes('stressed') || recent.includes('sad');
    const hasPositive = recent.includes('happy') || recent.includes('calm') || recent.includes('excited');

    if (hasStress) return 'deeply_empathic_grounding';
    if (hasPositive) return 'warmly_encouraging';
    return 'gentle_neutral';
  }

  // Process user message and craft tailored response
  respond(userMessage) {
    const trimmed = userMessage.trim();
    if (!trimmed) return null;

    // 1. Safety Guard Check: Crisis / Self-Harm
    const isCrisis = CRISIS_KEYWORDS.some(pattern => pattern.test(trimmed));
    if (isCrisis) {
      return {
        text: `I hear how deeply overwhelmed and in pain you are right now. Please know that your life matters immensely, and you do not have to carry this alone.\n\nImmediate human support is waiting for you 24/7, completely free and confidential:\n\n• **Suicide & Crisis Lifeline:** Call or Text **988** (US/Canada)\n• **Crisis Text Line:** Text **HOME to 741741**\n• **India Helpline:** **1800-599-0019** (KIRAN) or +91 9999 666 555\n• **International:** Visit our Crisis Support page anytime.`,
        isCrisis: true,
        actionLink: '/crisis',
        actionText: 'Open Crisis Support & Safety Plan 🛡️'
      };
    }

    const tone = this.getUserToneProfile();
    const lower = trimmed.toLowerCase();

    // 2. Breathwork request
    if (lower.includes('breath') || lower.includes('panic') || lower.includes('can\'t breathe') || lower.includes('overwhelm')) {
      return {
        text: `Let's pause right here together. Drop your shoulders down from your ears. Unclench your jaw. \n\nTry taking a slow inhale through your nose for 4 counts, hold gently for 7, and exhale with a soft sigh for 8 counts. Our 3D breathing guide is ready whenever you want visual pacing.`,
        actionLink: '/breathing',
        actionText: 'Begin Guided Breathwork 🌬️'
      };
    }

    // 3. Sleep / Tiredness
    if (lower.includes('sleep') || lower.includes('tired') || lower.includes('insomnia') || lower.includes('exhausted')) {
      return {
        text: `Exhaustion makes everything feel twice as heavy. Give yourself permission to lower the bar today. You don't need to be productive right now. Have you tried dimming lights and writing down whatever thoughts are racing?`,
        actionLink: '/journal',
        actionText: 'Evening Decompression Journal ✍️'
      };
    }

    // 4. Mood reflection
    if (lower.includes('sad') || lower.includes('lonely') || lower.includes('cry') || lower.includes('down')) {
      return {
        text: `It is completely okay to feel sad. Sadness is not a failure; it is just a sign that your body and heart have been carrying a lot. What does the kindest, gentlest version of yourself want to tell you right now?`,
        actionLink: '/journal',
        actionText: 'Write in Your Journal'
      };
    }

    // 5. Success / Gratitude / Feeling good
    if (lower.includes('good') || lower.includes('happy') || lower.includes('better') || lower.includes('great') || lower.includes('thank')) {
      return {
        text: `I am so glad to hear that warmth in your words ✨ Savor this sensation for a moment — feel where lightness sits in your chest or shoulders. Remembering what ease feels like builds a safe harbor for harder days.`,
        actionLink: '/routine',
        actionText: 'Log a Daily Habit 🌱'
      };
    }

    // Default context-calibrated response
    if (tone === 'deeply_empathic_grounding') {
      return {
        text: `I'm holding space with you. Notice your feet touching the floor and the surface holding you up right now. Whatever thoughts are coming, you don't have to fight them — just let them pass like clouds across the sky. Would you like to try a gentle grounding exercise?`,
        actionLink: '/breathing',
        actionText: 'Try 3-Minute Grounding 🌿'
      };
    }

    return {
      text: `Thank you for sharing that with me. Every time you tune into your inner world, you strengthen your self-understanding. I'm right here with you. What would feel most nourishing for you right now?`,
      actionLink: '/dashboard',
      actionText: 'View Today’s Sanctuary Rhythm'
    };
  }
}
