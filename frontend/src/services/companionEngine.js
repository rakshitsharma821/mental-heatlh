// ============================================
// MindCare — AI Sanctuary Companion Engine
// Task 5 Strict Content-Safety & Sensitive Word Protocol:
// 1. Bot NEVER proactively introduces negative/triggering words:
//    (self-harm, suicide, depression, stress, anxiety, harassment, panic, etc.)
// 2. Proactive greeting NEVER echoes mood labels like "anxious" or "stressed".
// 3. Even when user introduces a sensitive word, bot replies gently without echoing it,
//    and asks: "Would you like me to call a helpline for you?"
//    Only after user agrees ("yes", "please", "call") are helpline details displayed.
// 4. Output filter scans every reply and sanitizes/rewrites blocked words.
// Uses single source of truth from shared/safeLanguage.js
// ============================================

import { Storage } from './storage.js';
import {
  BLOCKED_WORDS,
  CRISIS_PATTERNS,
  INDIA_HELPLINES_MESSAGE,
  HELPLINE_QUESTION,
  filterBotOutput,
  isCrisisIntent,
  detectUserIntroducedWords
} from '../../../shared/safeLanguage.js';

export { BLOCKED_WORDS, CRISIS_PATTERNS, INDIA_HELPLINES_MESSAGE, HELPLINE_QUESTION, filterBotOutput };

export class SanctuaryCompanion {
  constructor(user) {
    this.user = user;
    this.name = 'Aria';
    this.pendingHelplineAgreement = false;
  }

  // Detect proactive milestones to warmly greet the user (Zero negative echoing)
  getProactiveMilestoneGreeting() {
    const user = this.user || (typeof Storage !== 'undefined' && Storage.getCurrentUser ? Storage.getCurrentUser() : null);
    const streak = user?.streak || 1;
    const displayName = user?.name ? user.name.split(' ')[0] : 'friend';

    if (streak >= 5) {
      return `Welcome back, ${displayName} 🌿 I noticed you've kept a ${streak}-day sanctuary streak! That consistency is a genuine gift you are giving yourself. How are you feeling in this moment?`;
    }

    // Gentle neutral greeting without echoing negative check-in labels
    return `Welcome to your sanctuary, ${displayName}. I'm Aria, your gentle wellness companion. I remember your journey and I'm here whenever you need a grounded, quiet space to reflect. How does your body feel right now?`;
  }

  // Process user message and craft tailored response
  respond(userMessage, action = null) {
    // Structured action consent support
    if (action && action.type === 'helpline_consent') {
      if (action.value === 'yes') {
        this.pendingHelplineAgreement = false;
        return {
          text: INDIA_HELPLINES_MESSAGE,
          isCrisis: true,
          actionLink: '/crisis',
          actionText: 'Open Crisis Support & Safety Plan 🛡️'
        };
      } else {
        this.pendingHelplineAgreement = false;
        return {
          text: 'I understand completely. We can take things at whatever pace feels steady for you. Would you like to try a calming breathing exercise or simply reflect quietly?',
          isCrisis: false,
          actionLink: '/breathing',
          actionText: 'Try Gentle Breathing'
        };
      }
    }

    const trimmed = (userMessage || '').trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();

    // 1. If user was previously offered helpline and agreed
    if (this.pendingHelplineAgreement) {
      // Must be an explicit affirmative answer
      const isAffirmative = /\b(yes|yeah|yep|sure|please|call|okay|ok|agree|please do|ha|haan|zaroor)\b/i.test(trimmed);
      const isRejectionOrAmbiguous = /\b(no|nah|nope|don'?t|leave me alone|stop|not now|nahi|mat)\b/i.test(trimmed);

      if (isAffirmative && !isRejectionOrAmbiguous) {
        this.pendingHelplineAgreement = false;
        return {
          text: INDIA_HELPLINES_MESSAGE,
          isCrisis: true,
          actionLink: '/crisis',
          actionText: 'Open Crisis Support & Safety Plan 🛡️'
        };
      } else {
        // Declined or changed topic
        this.pendingHelplineAgreement = false;
      }
    }

    // 2. Immediate Crisis Trigger Check
    const hasCrisis = isCrisisIntent(trimmed);
    if (hasCrisis) {
      this.pendingHelplineAgreement = true;
      const initialGentleOffer = `I hear how deeply heavy things feel right now, and you do not have to carry this alone. ${HELPLINE_QUESTION}`;
      return {
        text: initialGentleOffer,
        isCrisis: true,
        actionLink: '/crisis',
        actionText: 'Connect to Helpline / Crisis Support 🛡️'
      };
    }

    // 3. Sensitive keywords check
    const userWords = detectUserIntroducedWords(trimmed);
    if (userWords.length > 0) {
      this.pendingHelplineAgreement = true;
      const responseText = `Thank you for trusting me with what you are experiencing right now. Your well-being matters deeply. ${HELPLINE_QUESTION}`;
      return {
        text: responseText,
        isCrisis: false,
        actionLink: '/crisis',
        actionText: 'View Crisis Helplines 🛡️'
      };
    }

    // 4. Breathwork request
    if (lower.includes('breath') || lower.includes('overwhelm') || lower.includes('grounding')) {
      const draft = `Let's pause right here together. Drop your shoulders down from your ears and unclench your jaw. Try taking a slow inhale through your nose for 4 counts, hold gently for 7, and exhale with a soft sigh for 8 counts. Our 3D breathing guide is ready whenever you want visual pacing.`;
      return {
        text: filterBotOutput(draft, trimmed),
        actionLink: '/breathing',
        actionText: 'Begin Guided Breathwork 🌬️'
      };
    }

    // 5. Sleep / Tiredness
    if (lower.includes('sleep') || lower.includes('tired') || lower.includes('exhausted')) {
      const draft = `Rest is not a reward you have to earn; it is a fundamental need. Give yourself permission to lower the bar today. Would you like to try writing down any thoughts before resting?`;
      return {
        text: filterBotOutput(draft, trimmed),
        actionLink: '/journal',
        actionText: 'Evening Decompression Journal ✍️'
      };
    }

    // 6. Gratitude / Positive rhythm
    if (lower.includes('good') || lower.includes('happy') || lower.includes('better') || lower.includes('great') || lower.includes('thank')) {
      const draft = `I am so glad to share this lightness with you ✨ Take a quiet moment to notice where that ease settles in your body. Celebrating small moments of peace builds a steady inner home.`;
      return {
        text: filterBotOutput(draft, trimmed),
        actionLink: '/routine',
        actionText: 'Log a Daily Habit 🌱'
      };
    }

    // Default gentle empathic response
    const draft = `Thank you for sharing that with me. Every time you tune into your inner world, you strengthen your relationship with yourself. I'm right here with you. What would feel most nourishing for you in this moment?`;
    return {
      text: filterBotOutput(draft, trimmed),
      actionLink: '/dashboard',
      actionText: 'View Today’s Sanctuary Rhythm'
    };
  }
}
