// ============================================
// MindCare Backend — Request Input Validation Middleware
// Validates parameters, types, ranges, and formats before controller execution
// ============================================

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validators = {
  validateRegister: (req, res, next) => {
    const { email, password, name, age } = req.body;
    if (!email || !EMAIL_REGEX.test(String(email).trim())) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
    }
    if (age !== undefined) {
      const parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
        return res.status(400).json({ success: false, message: 'Invalid age provided.' });
      }
    }
    next();
  },

  validateLogin: (req, res, next) => {
    const { identifier, email, password } = req.body;
    const effectiveId = identifier || email;
    if (!effectiveId || !String(effectiveId).trim()) {
      return res.status(400).json({ success: false, message: 'Login identifier or email is required.' });
    }
    if (!password || !String(password).trim()) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }
    next();
  },

  validateBooking: (req, res, next) => {
    const { preferred_slot, mode, slot_duration_minutes } = req.body;
    if (!preferred_slot || isNaN(new Date(preferred_slot).getTime())) {
      return res.status(400).json({ success: false, message: 'Valid preferred_slot timestamp is required.' });
    }
    if (mode && !['video', 'voice', 'chat'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'Mode must be video, voice, or chat.' });
    }
    if (slot_duration_minutes && ![30, 45, 60].includes(Number(slot_duration_minutes))) {
      return res.status(400).json({ success: false, message: 'Slot duration must be 30, 45, or 60 minutes.' });
    }
    next();
  }
};

export default validators;
