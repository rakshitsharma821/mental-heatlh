// ============================================
// MindCare — Wellness Quotes & Affirmations Service
// Re-exports from centralized config: frontend/src/config/wellnessQuotes.js
// ============================================

import { WELLNESS_QUOTES, MOOD_CONFIG } from '../config/wellnessQuotes';

export { WELLNESS_QUOTES, MOOD_CONFIG };

export function getQuoteOfDay() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  return WELLNESS_QUOTES[dayOfYear % WELLNESS_QUOTES.length];
}
