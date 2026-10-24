// ============================================
// MindCare Sanctuary — UI Locale & String Dictionary
// Single source of truth for all user-facing interface text
// Adheres strictly to repo rule: no hard-coded text in presentation layer
// ============================================

export const UI_STRINGS = {
  brand: {
    name: 'MindCare',
    tagline: 'Your calm, confidential mental wellness sanctuary.',
    subtext: 'Heal slowly. Rise stronger. An unhurried space for young adults.',
    sparkle: '✦',
    copyright: (year = new Date().getFullYear()) => `© ${year} MindCare. Crafted with care for mental health and gentle restoration.`
  },

  nav: {
    dashboard: 'Dashboard',
    mood: 'Mood',
    breathing: 'Breathing',
    routine: 'Routine',
    progress: 'Progress',
    community: 'Community',
    games: 'Games',
    admin: 'Admin',
    therapist: 'Therapist',
    settings: 'Settings & Privacy',
    logout: 'Log Out',
    login: 'Sign In',
    register: 'Get Started',
    crisisSupport: 'Emergency Crisis Support',
    roleAdminBadge: 'Admin Portal',
    roleTherapistBadge: 'Clinical Portal'
  },

  footer: {
    sanctuaryHeading: 'Sanctuary',
    safetyHeading: 'Safety & Ethics',
    privacyBadge: '100% Offline & Local Storage',
    crisisLink: 'Emergency Crisis Support 🛡️',
    privacyLink: 'Privacy & Data Controls 🔒'
  },

  buttons: {
    getStarted: 'Begin Sanctuary Journey',
    takeAssessment: 'Begin 2-Minute Reflection',
    breatheWithUs: 'Start Calming Breathwork',
    exploreGarden: 'Visit Growth Garden',
    talkToAria: 'Talk to Aria (AI Companion)',
    bookTherapist: 'Connect with a Professional',
    save: 'Save Changes',
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
    skip: 'Skip directly to Dashboard →',
    submit: 'Submit',
    close: 'Close',
    refresh: 'Refresh',
    confirm: 'Confirm'
  },

  companion: {
    title: 'Aria',
    subtitle: 'AI Wellness Companion',
    status: 'Compassionate & confidential support',
    inputPlaceholder: 'Share how you are feeling or ask for a calming breath...',
    clearMemoryPrompt: 'Clear your companion conversation history?',
    quickRepliesPrompt: 'Would you like me to call a helpline for you?',
    quickReplyYes: 'Yes, please',
    quickReplyNo: 'No, let us keep talking'
  },

  clinical: {
    requestTitle: 'Request a Consultation',
    requestSubtitle: 'Private, gated sessions conducted by verified mental health professionals.',
    sessionDuration: 'Duration: 45 min',
    bookingSuccess: 'Session Request Submitted',
    bookingSuccessDetail: 'Your appointment request is queued with clinical coordination. You will receive real-time updates directly on your dashboard.'
  },

  common: {
    loading: 'Arriving in this space...',
    errorGeneric: 'Something unexpected happened. Take a gentle breath and try again.',
    empty: 'No items recorded yet.',
    selfReflectionDisclaimer: 'This is a self-reflection tool, not a diagnosis.'
  }
};

export default UI_STRINGS;
