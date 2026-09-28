// ============================================
// MindCare — Emergency Crisis Directory & Safety Planner
// 100% Client-side, zero external AI dependency
// ============================================

export const CRISIS_HELPLINES = [
  {
    country: 'United States & Canada',
    flag: '🇺🇸 🇨🇦',
    service: 'Suicide & Crisis Lifeline',
    number: '988',
    callUrl: 'tel:988',
    textOption: 'Text 988 or chat at 988lifeline.org',
    availability: '24/7, Free, Confidential'
  },
  {
    country: 'United States & Canada',
    flag: '💬',
    service: 'Crisis Text Line',
    number: '741741',
    callUrl: 'sms:741741?body=HOME',
    textOption: 'Text HOME to 741741',
    availability: '24/7, Free, Confidential'
  },
  {
    country: 'United Kingdom',
    flag: '🇬🇧',
    service: 'Samaritans UK',
    number: '116 123',
    callUrl: 'tel:116123',
    textOption: 'Email jo@samaritans.org',
    availability: '24/7, Free'
  },
  {
    country: 'India',
    flag: '🇮🇳',
    service: 'KIRAN Mental Health Helpline',
    number: '1800-599-0019',
    callUrl: 'tel:18005990019',
    textOption: 'Vandrevala Foundation: +91 9999 666 555',
    availability: '24/7, Toll-free, Multilingual'
  },
  {
    country: 'Australia',
    flag: '🇦🇺',
    service: 'Lifeline Australia',
    number: '13 11 14',
    callUrl: 'tel:131114',
    textOption: 'Text 0477 13 11 14',
    availability: '24/7, Free'
  },
  {
    country: 'International Directory',
    flag: '🌍',
    service: 'Befrienders Worldwide / IASP',
    number: 'Find local helpline',
    callUrl: 'https://www.befrienders.org',
    textOption: 'Visit befrienders.org or iasp.info/resources/Crisis_Centres',
    availability: 'Global directory in over 40 countries'
  }
];

export const GROUNDING_54321 = [
  { step: '5 Things You Can See', desc: 'Look around. Name 5 specific items (a shadow, a pattern, a plant, a colour).' },
  { step: '4 Things You Can Physically Feel', desc: 'Notice 4 textures (feet on the floor, fabric on your skin, back against chair).' },
  { step: '3 Things You Can Hear', desc: 'Listen closely for 3 ambient sounds (distant traffic, a fan, your own breathing).' },
  { step: '2 Things You Can Smell', desc: 'Detect 2 scents (soap, air, clothing, tea, or a pleasant memory of a scent).' },
  { step: '1 Thing You Can Taste', desc: 'Notice the current taste in your mouth, or take a slow sip of cool water.' }
];
