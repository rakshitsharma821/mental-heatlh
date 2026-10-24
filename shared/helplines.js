// ============================================
// MindCare Sanctuary — Single Source of Truth for Helplines
// Shared between frontend and backend
// ============================================

export const HELPLINES = [
  {
    id: 'tele-manas',
    name: 'Tele-MANAS',
    authority: 'Ministry of Health & Family Welfare, Govt. of India',
    numbers: ['14416', '1800-891-4416'],
    primaryNumber: '14416',
    tollFree: true,
    availableHours: '24/7',
    description: 'National tele-mental health programme providing free, confidential psychological first aid and counseling.',
    languages: 'Multi-lingual (20+ Indian languages)'
  },
  {
    id: 'kiran',
    name: 'KIRAN Mental Health Helpline',
    authority: 'Ministry of Social Justice & Empowerment, Govt. of India',
    numbers: ['1800-599-0019'],
    primaryNumber: '1800-599-0019',
    tollFree: true,
    availableHours: '24/7',
    description: 'National helpline providing screening, first aid, psychological support, and distress management.',
    languages: 'Hindi, English & 11 regional languages'
  },
  {
    id: 'vandrevala',
    name: 'Vandrevala Foundation',
    authority: 'Mental Health & Suicide Prevention Support',
    numbers: ['+91 9999 666 555'],
    primaryNumber: '+91 9999 666 555',
    tollFree: false,
    availableHours: '24/7',
    description: 'Free, confidential, 24/7 crisis support and mental health counseling across India.',
    languages: 'English, Hindi & regional languages'
  },
  {
    id: 'aasra',
    name: 'AASRA',
    authority: 'Crisis Intervention & Suicide Prevention Centre',
    numbers: ['+91 98204 66726'],
    primaryNumber: '+91 98204 66726',
    tollFree: false,
    availableHours: '24/7',
    description: '24-hour voluntary, non-judgmental and confidential helpline for people in emotional distress.',
    languages: 'English, Hindi'
  }
];

export const HELPLINE_QUESTION = "Would you like me to call a helpline for you?";

export const INDIA_HELPLINES_MESSAGE = `Here are free, confidential helplines ready 24/7 for immediate support:

• **Tele-MANAS (Govt of India):** Call **14416** or **1800-891-4416** (Toll-Free, 24/7)
• **KIRAN Mental Health Helpline:** Call **1800-599-0019** (24/7 National Helpline)
• **Vandrevala Foundation:** Call **+91 9999 666 555** (Free, confidential 24/7)
• **AASRA:** Call **+91 98204 66726**

You can also visit our [Crisis Support Page](/crisis) anytime for personalized safety planning.`;
