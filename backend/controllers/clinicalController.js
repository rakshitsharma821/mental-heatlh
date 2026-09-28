// ============================================
// MindCare Backend — Clinical & Booking Controller
// ============================================

import { db } from '../models/db.js';

const DEFAULT_THERAPIST = {
  id: 'th_sarah_vance',
  name: 'Dr. Sarah Vance, PsyD',
  title: 'Licensed Clinical Psychologist',
  license: 'Lic #PSY-28491',
  specialties: ['CBT & Anxiety Management', 'Burnout Prevention', 'Somatic Regulation'],
  bio: 'Specializing in integrative mindfulness-based cognitive therapy, nervous system down-regulation, and compassionate burnout recovery.'
};

export const clinicalController = {
  getTherapist: (req, res) => {
    return res.json({ success: true, therapist: DEFAULT_THERAPIST });
  },

  getRequests: (req, res) => {
    const requests = db.getCollection('sessionRequests');
    return res.json({ success: true, requests });
  },

  submitBooking: (req, res) => {
    try {
      const { clientName, clientEmail, sessionType, preferredWindow, clientNote } = req.body;
      const requests = db.getCollection('sessionRequests');

      const newRequest = {
        id: 'req_' + Date.now(),
        clientName: clientName || 'Sanctuary Member',
        clientEmail: clientEmail || '',
        sessionType: sessionType || 'Virtual Video Consultation (45 min)',
        preferredWindow: preferredWindow || 'Next Available',
        clientNote: (clientNote || '').trim(),
        status: 'Pending Confirmation',
        submittedAt: new Date().toISOString(),
        therapistId: DEFAULT_THERAPIST.id,
        therapistName: DEFAULT_THERAPIST.name
      };

      requests.unshift(newRequest);
      db.saveCollection('sessionRequests', requests);

      return res.status(201).json({ success: true, request: newRequest });
    } catch (err) {
      console.error('Booking error:', err);
      return res.status(500).json({ success: false, message: 'Failed to submit appointment request.' });
    }
  },

  updateRequestStatus: (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const requests = db.getCollection('sessionRequests');
      const updated = requests.map(r => r.id === id ? { ...r, status } : r);
      db.saveCollection('sessionRequests', updated);

      return res.json({ success: true, requests: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update request status.' });
    }
  }
};
