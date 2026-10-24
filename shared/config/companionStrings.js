// ============================================
// MindCare Sanctuary — AI Companion Strings & Locale Defaults
// Single source of truth for conversational content
// ============================================

export const COMPANION_STRINGS = {
  greetings: {
    streak: (name, count) =>
      `Welcome back, ${name} 🌿 I noticed you've kept a ${count}-day sanctuary streak! That consistency is a genuine gift you are giving yourself. How are you feeling in this moment?`,
    general: (name) =>
      `Welcome to your sanctuary, ${name}. I'm Aria, your gentle wellness companion. I remember your journey and I'm here whenever you need a grounded, quiet space to reflect. How does your body feel right now?`
  },
  consentPrompts: {
    crisis: "I hear how deeply heavy things feel right now, and you do not have to carry this alone. Would you like me to call a helpline for you?",
    sensitive: "Thank you for trusting me with what you are experiencing right now. Your well-being matters deeply. Would you like me to call a helpline for you?",
    declined: "I understand completely. We can take things at whatever pace feels steady for you. Would you like to try a calming breathing exercise or simply reflect quietly?"
  },
  mindfulnessGuidance: {
    breathwork: "Let's pause right here together. Drop your shoulders down from your ears and unclench your jaw. Try taking a slow inhale through your nose for 4 counts, hold gently for 7, and exhale with a soft sigh for 8 counts. Our 3D breathing guide is ready whenever you want visual pacing.",
    rest: "Rest is not a reward you have to earn; it is a fundamental need. Give yourself permission to lower the bar today. Would you like to try writing down any thoughts before resting?",
    gratitude: "I am so glad to share this lightness with you ✨ Take a quiet moment to notice where that ease settles in your body. Celebrating small moments of peace builds a steady inner home.",
    defaultEmpathy: "Thank you for sharing that with me. Every time you tune into your inner world, you strengthen your relationship with yourself. I'm right here with you. What would feel most nourishing for you in this moment?"
  },
  welcomeFallbacks: [
    "Take a slow breath, then continue.",
    "Your sanctuary is ready whenever you need a moment of calm.",
    "Every small step toward stillness is a meaningful choice."
  ]
};
