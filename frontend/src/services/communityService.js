// ============================================
// MindCare — Privacy-Gated Community Matching Service
// Opt-in only, strictly matched on explicitly chosen intentions/goals.
// ZERO leakage: Never accesses mood, journal sentiment, or clinical records.
// ============================================

import { Storage } from './storage';

const KEYS = {
  USER_INTERESTS: 'mindcare_user_interests',
  COMMUNITY_OPT_IN: 'mindcare_community_opt_in',
  COMMUNITY_POSTS: 'mindcare_community_posts'
};

export const WELLNESS_INTENTIONS = [
  { id: 'breath', label: '🌿 Mindful Breathing & Nervous System Calm', category: 'Mindfulness' },
  { id: 'sleep', label: '💤 Restful Sleep Habits & Wind-Down', category: 'Rhythms' },
  { id: 'nature', label: '🚶 Nature Walks & Somatic Grounding', category: 'Somatic' },
  { id: 'journal', label: '✍️ Daily Expressive Journaling', category: 'Reflection' },
  { id: 'morning', label: '☀️ Morning Momentum & Gentle Routines', category: 'Rhythms' },
  { id: 'creativity', label: '🎨 Creative Flow & Stress Release', category: 'Expression' },
  { id: 'quiet', label: '🍵 Quiet Living & Digital Declutter', category: 'Lifestyle' },
  { id: 'compassion', label: '🌱 Compassionate Self-Talk & Defusion', category: 'Mindset' }
];

const PRESET_CIRCLES = [
  {
    id: 'circle_breath_quiet',
    title: 'Sanctuary of Gentle Stillness',
    description: 'A quiet circle focusing on breath pacing, down-regulation, and intentional screen pauses.',
    tags: ['breath', 'quiet', 'nature'],
    membersCount: 84,
    themeColor: '#40916c',
    recentEncouragements: [
      { id: 'c1', author: 'Willow Seeker', text: 'Took 4 deep box breaths before starting my day today.', time: '12m ago', hearts: 6 },
      { id: 'c2', author: 'Morning Mist', text: 'Gentle reminder: you don’t have to finish everything right now.', time: '1h ago', hearts: 14 }
    ]
  },
  {
    id: 'circle_rhythm_sleep',
    title: 'Evening Calm & Restful Rhythm',
    description: 'Fellow travelers supporting each other in regular bedtime habits and peaceful evening wind-downs.',
    tags: ['sleep', 'journal', 'morning'],
    membersCount: 112,
    themeColor: '#72a1bf',
    recentEncouragements: [
      { id: 'c3', author: 'Cedar Branch', text: 'Turned off overhead lights at 9 PM and felt a deep sigh of relief.', time: '45m ago', hearts: 9 },
      { id: 'c4', author: 'Quiet Horizon', text: 'Journaled three small things I appreciated from today.', time: '2h ago', hearts: 11 }
    ]
  },
  {
    id: 'circle_creative_compassion',
    title: 'Creative Growth & Kind Words',
    description: 'A warm space celebrating daily emotional growth, mindful creation, and treating ourselves with grace.',
    tags: ['creativity', 'compassion', 'journal'],
    membersCount: 67,
    themeColor: '#d4a373',
    recentEncouragements: [
      { id: 'c5', author: 'Fern Leaf', text: 'Allowed myself to make an imperfect sketch without judgment.', time: '30m ago', hearts: 8 },
      { id: 'c6', author: 'Sunlit Sprout', text: 'Your growth isn’t a race; plants grow quietly in the dark.', time: '3h ago', hearts: 19 }
    ]
  }
];

export const CommunityService = {
  getAvailableIntentions: () => WELLNESS_INTENTIONS,

  isOptedIn: () => {
    return Storage.get(KEYS.COMMUNITY_OPT_IN, false);
  },

  setOptIn: (optedIn) => {
    Storage.set(KEYS.COMMUNITY_OPT_IN, optedIn);
    return optedIn;
  },

  getUserInterests: () => {
    return Storage.get(KEYS.USER_INTERESTS, []);
  },

  saveUserInterests: (interests) => {
    Storage.set(KEYS.USER_INTERESTS, interests);
    return interests;
  },

  toggleInterest: (interestId) => {
    const current = CommunityService.getUserInterests();
    const updated = current.includes(interestId)
      ? current.filter(id => id !== interestId)
      : [...current, interestId];
    CommunityService.saveUserInterests(updated);
    return updated;
  },

  // Matches circles based solely on overlapping explicit interest tags
  getMatchedCircles: () => {
    const userInterests = CommunityService.getUserInterests();
    if (!userInterests || userInterests.length === 0) {
      // Return all circles as discoverable if no specific interests selected yet
      return PRESET_CIRCLES.map(c => ({ ...c, matchScore: 1 }));
    }

    return PRESET_CIRCLES.map(circle => {
      const overlap = circle.tags.filter(t => userInterests.includes(t)).length;
      return {
        ...circle,
        matchScore: overlap,
        isRecommended: overlap > 0
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  },

  // Wholesome anonymous encouragement posts
  getCircleEncouragements: (circleId) => {
    const stored = Storage.get(`${KEYS.COMMUNITY_POSTS}_${circleId}`, null);
    if (stored) return stored;
    const circle = PRESET_CIRCLES.find(c => c.id === circleId);
    return circle ? circle.recentEncouragements : [];
  },

  sendEncouragement: (circleId, text, alias = 'Gentle Wanderer') => {
    const list = CommunityService.getCircleEncouragements(circleId);
    const newPost = {
      id: 'enc_' + Date.now(),
      author: alias,
      text: text.trim(),
      time: 'Just now',
      hearts: 1
    };
    const updated = [newPost, ...list];
    Storage.set(`${KEYS.COMMUNITY_POSTS}_${circleId}`, updated);
    return updated;
  },

  cheerEncouragement: (circleId, postId) => {
    const list = CommunityService.getCircleEncouragements(circleId);
    const updated = list.map(item => item.id === postId ? { ...item, hearts: item.hearts + 1 } : item);
    Storage.set(`${KEYS.COMMUNITY_POSTS}_${circleId}`, updated);
    return updated;
  }
};
