// ============================================
// MindCare Sanctuary — Legal & Business Entity Configuration
// Single source of truth for white-label platform compliance,
// India DPDP Act 2023, Telemedicine Guidelines, and Grievance Redressal
// ============================================

export const LEGAL_CONFIG = {
  platformName: 'MindCare Sanctuary',
  legalEntityName: 'MindCare Health Technologies Private Limited',
  brandTagline: 'Confidential Mental Wellness Sanctuary',
  operatingJurisdiction: 'Republic of India',
  governingLaw: 'Digital Personal Data Protection Act (DPDP) 2023, Mental Healthcare Act 2017, and Information Technology Act 2000',
  
  registeredOffice: {
    addressLine1: 'MindCare Sanctuary Tech Park, Level 4',
    addressLine2: 'Outer Ring Road, Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560103',
    country: 'India'
  },

  contact: {
    supportEmail: 'support@mindcare.test',
    legalEmail: 'legal@mindcare.test',
    privacyEmail: 'privacy@mindcare.test',
    workingHours: 'Monday – Saturday: 09:00 AM – 08:00 PM IST',
    phone: '+91 80 4912 3400'
  },

  grievanceOfficer: {
    name: 'Aarav Singhania',
    designation: 'Statutory Grievance Redressal & Data Protection Officer',
    email: 'grievance.officer@mindcare.test',
    address: 'MindCare Sanctuary Tech Park, Level 4, Outer Ring Road, Bellandur, Bengaluru, Karnataka - 560103, India',
    responseSla: 'Acknowledgment within 24 hours; complete resolution within 15 calendar days as mandated by DPDP Act 2023 and IT Rules 2021'
  },

  emergencyHelplines: [
    { name: 'Tele-MANAS (Ministry of Health & Family Welfare, 24/7 Toll-Free)', number: '14416 / 1800-891-4416', available: '24/7' },
    { name: 'KIRAN (National Mental Health Helpline by MSJE)', number: '1800-599-0019', available: '24/7' },
    { name: 'Vandrevala Foundation for Mental Health', number: '+91 9999 666 555', available: '24/7' },
    { name: 'National Emergency Response System', number: '112', available: '24/7' }
  ],

  clinicalDisclaimer: 'MindCare Sanctuary is a digital mental wellness self-care and tele-consultation facilitation platform. It is NOT an emergency suicide intervention service or a replacement for inpatient psychiatric medical attention. If you or someone you know is experiencing thoughts of self-harm or acute psychological crisis, please immediately dial 112 or Tele-MANAS at 14416.',

  telemedicineComplianceNotice: 'All registered clinicians on MindCare Sanctuary operate in strict compliance with the Telemedicine Practice Guidelines issued jointly by NITI Aayog and the National Medical Commission (NMC). Tele-consultations cannot prescribe Schedule X psychotropic substances, and initial consultations are subject to independent clinician evaluation.'
};

export default LEGAL_CONFIG;
