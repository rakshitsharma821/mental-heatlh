// ============================================
// MindCare Sanctuary — Welcome Fallback Messages Config
// Centralized locale for onboarding greetings
// ============================================

export const NEUTRAL_FALLBACKS = [
  (name) => `Take a soft breath, ${name}. Wherever today finds you, give yourself permission to slow down for just a few moments. You are worthy of quiet rest and steady care.`,
  (name) => `Welcome to your sanctuary, ${name}. In a world that constantly demands hurry, this space is yours to simply arrive as you are, without expectations or rush.`,
  (name) => `Hello ${name}. The path you are navigating holds many possibilities, and each mindful pause builds your inner quiet. Let us take this next step together.`,
  (name) => `${name}, you made it here today — and that matters. This is a space without judgment or hurry, just a gentle invitation to breathe and reflect.`,
  (name) => `Good to see you, ${name}. This moment belongs to you. Let your shoulders soften and your thoughts settle. You are in the right place.`
];

export function getRandomFallback(name) {
  const idx = Math.floor(Math.random() * NEUTRAL_FALLBACKS.length);
  return NEUTRAL_FALLBACKS[idx](name || 'Friend');
}
