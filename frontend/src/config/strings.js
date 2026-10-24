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
    crisisLink: 'Emergency Crisis Support',
    privacyLink: 'Privacy & Data Controls'
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
  },

  hero: {
    badge: 'Confidential Mental Wellness Sanctuary',
    titleLine1: 'Heal slowly.',
    titleLine2: 'Rise stronger.',
    subtext: 'An unhurried space for mindful breathwork, emotional rhythm tracking, and gentle cognitive reflection. Free of judgment, ads, and surveillance.',
    breatheIn: 'Breathe in...',
    breatheOut: 'Breathe out...',
    breatheCycleCaption: '9s Natural Respiratory Cycle • Adaptive Calming',
    ctaDashboard: 'Open Your Dashboard →',
    ctaRegister: 'Begin Sanctuary Journey →',
    ctaBreathing: '3D Breathwork',
    privacyNote: 'Zero ad tracking • AES-256 Encrypted Journals • DPDP Compliant'
  },

  sessionFlow: {
    heading: 'How a session happens',
    subheading: 'A transparent, steady process designed around your schedule and comfort.',
    step1Title: 'Take a short check-in',
    step1Desc: 'Share what is on your mind through our unhurried 2-minute pulse, or skip straight to scheduling.',
    step2Title: 'Use calming tools or talk to Aria',
    step2Desc: 'Ground yourself with paced breathwork or private companion reflection while preparing for your session.',
    step3Title: 'Ask for a session; our team matches you with a verified therapist',
    step3Desc: 'Request an appointment at a time that works for you. Our clinical team matches you with a qualified, verified therapist.',
    step4Title: 'Chat or call at the confirmed time',
    step4Desc: 'Join an encrypted, private session directly in your browser. No external downloads or third-party meeting links required.',
    professionalNoticePrompt: 'Are you a mental health professional?',
    professionalNoticeLink: 'Apply to join.',
    professionalNoticeGuarantee: 'Every therapist is verified by our team before they see any client.'
  },

  landing: {
    flowBadge: 'Mindful Flow',
    flowTitle: 'How MindCare Works',
    flowSubtitle: 'A calm, 3-step rhythm designed to meet young adults wherever they are today.',
    step1Title: '2-Minute Self-Reflection',
    step1Desc: 'Answer a fixed, non-clinical 8-question pulse. MindCare tunes your recommended breathing patterns, focus games, and soothing soundscapes without diagnostic labels.',
    step1Footer: 'Step 1 of Sanctuary Flow →',
    step2Title: 'Tailored Daily Rhythms',
    step2Desc: 'Engage in 3D pacing breathwork, tactile Zen gardening, and encrypted reflective journaling. Your digital twin gently responds to every mindful pause.',
    step2Footer: 'Step 2 of Sanctuary Flow →',
    step3Title: 'Companion & Clinical Care',
    step3Desc: 'Talk with Aria, our non-judgmental AI companion, or request a 1-on-1 consultation with verified psychologists and psychiatrists whenever deeper human support is needed.',
    step3Footer: 'Step 3 of Sanctuary Flow →',
    coreBadge: 'Sanctuary Core',
    coreTitle: 'Gentle Tools for Daily Renewal',
    coreSubtitle: 'Designed around physiological nervous system down-regulation, compassionate reflection, and clinical autonomy.',
    pillar1Title: '3D Guided Breathwork',
    pillar1Desc: 'A calming procedural brain and responsive rhythm orb that expands and contracts with your natural respiratory cycles.',
    pillar1Cta: 'Begin Breathwork →',
    pillar2Title: 'Aria AI Companion',
    pillar2Desc: 'A warm, grounded wellness friend governed by strict safe-language rules. Aria never diagnoses, never echoes negative triggers, and offers calm guidance.',
    pillar2Badge: 'Always Available in Corner ✦',
    pillar3Title: 'Encrypted Journal',
    pillar3Desc: 'A private shelter for unfiltered reflection. Thought logs are defended with authenticated AES-256-GCM encryption before storage.',
    pillar3Cta: 'Open Private Journal →',
    pillar4Title: 'Crisis Lifeline & Safety Plan',
    pillar4Desc: 'Zero-barrier emergency helplines (Tele-MANAS 14416, KIRAN) and an interactive 5-step digital safety plan that functions independently of all other systems.',
    pillar4Cta: 'Immediate Lifeline →',
    clinicalBadge: 'Licensed Care Network',
    clinicalTitle: 'Verified Mental Health Professionals',
    clinicalSubtitle: 'Access verified psychologists and psychiatrists credentialed with RCI licensing. Real availability from our clinical network:',
    cliniciansCountLabel: 'Verified Clinicians',
    cliniciansSubLabel: 'RCI Credentialed • Encrypted WebRTC',
    rciVerified: 'RCI VERIFIED',
    requestConsultation: 'Request Consultation ↗',
    bookConsultationCta: 'Book a Confidential Consultation',
    privacyBadge: 'Zero-Trust Architecture',
    privacyTitle: 'Your Mind, Your Sovereignty',
    privacySubtitle: 'MindCare was engineered from ground zero to uphold India’s Digital Personal Data Protection (DPDP) Act and international medical privacy standards.',
    privacyItem1Title: 'Client-Side Encryption',
    privacyItem1Desc: 'Journals and sensitive thoughts are scrambled on your device before transmission. No staff member can read your private reflections.',
    privacyItem2Title: 'Zero Ad Monetization',
    privacyItem2Desc: 'No tracking pixels, third-party brokers, or behavioral analytics cookies. Your emotional rhythm is never an advertising target.',
    privacyItem3Title: 'One-Click Data Purge',
    privacyItem3Desc: 'Under Settings & Privacy, you can export your complete history in JSON format or trigger an instant, irreversible data erasure anytime.'
  }
};

export default UI_STRINGS;
