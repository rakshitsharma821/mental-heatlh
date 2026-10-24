// ============================================
// MindCare Sanctuary — Questionnaire Score Bands Single Reference
// Reusable by backend aggregates and frontend config
// ============================================

export const SCORE_BANDS = {
  low: {
    id: 'low',
    title: 'Steady Rhythm',
    badge: 'Steady State',
    minScore: 0,
    maxScore: 7,
    themeColor: '#52b788',
    summary: 'Steady baseline resilience with room for restorative grounding.'
  },
  moderate: {
    id: 'moderate',
    title: 'Rest & Reset',
    badge: 'Rest & Reset',
    minScore: 8,
    maxScore: 15,
    themeColor: '#d97706',
    summary: 'Accumulated stress or fatigue calling for intentional relief.'
  },
  high: {
    id: 'high',
    title: 'Care & Comfort',
    badge: 'Gentle Support',
    minScore: 16,
    maxScore: 24,
    themeColor: '#b91c1c',
    summary: 'High emotional load; gentle somatic ease and professional care ready.'
  }
};

export function getBandDetails(bandIdOrScore) {
  if (typeof bandIdOrScore === 'number') {
    const s = Math.max(0, Math.min(24, bandIdOrScore));
    if (s <= 7) return SCORE_BANDS.low;
    if (s <= 15) return SCORE_BANDS.moderate;
    return SCORE_BANDS.high;
  }
  const key = String(bandIdOrScore || '').toLowerCase();
  return SCORE_BANDS[key] || SCORE_BANDS.moderate;
}
