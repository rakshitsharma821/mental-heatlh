// ============================================
// MindCare Backend — Notification Controller (Part 7)
// Endpoints for opt-in consent, quiet hours, and in-app sanctuary notices
// ============================================

import { NotificationService } from '../utils/notificationService.js';

export const notificationController = {
  /**
   * GET /api/notifications/preferences
   * Fetch current user's notification preferences
   */
  getPreferences: async (req, res) => {
    try {
      const userId = req.user.id;
      const prefs = await NotificationService.getPreferences(userId);
      return res.json({ success: true, preferences: prefs });
    } catch (err) {
      console.error('getPreferences error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch notification preferences.' });
    }
  },

  /**
   * PUT /api/notifications/preferences
   * Update notification preferences & record consent timestamp + audit
   */
  updatePreferences: async (req, res) => {
    try {
      const userId = req.user.id;
      const clientMeta = {
        ip: req.ip || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null
      };

      const updated = await NotificationService.updatePreferences(userId, req.body, clientMeta);
      return res.json({
        success: true,
        message: updated.optIn
          ? 'Notification consent recorded. Mindful alerts enabled.'
          : 'Notifications safely turned off. Silence restored.',
        preferences: updated
      });
    } catch (err) {
      console.error('updatePreferences error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update notification preferences.' });
    }
  },

  /**
   * GET /api/notifications
   * Get delivered in-app notifications
   */
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit, 10) || 50;
      const data = await NotificationService.getDeliveredNotifications(userId, limit);
      return res.json({ success: true, ...data });
    } catch (err) {
      console.error('getNotifications error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
    }
  },

  /**
   * PATCH /api/notifications/:id/read
   * Mark a notification as read
   */
  markAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updated = await NotificationService.markAsRead(id, userId);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found.' });
      }
      return res.json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
      console.error('markAsRead error:', err);
      return res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
    }
  },

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read
   */
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      await NotificationService.markAllAsRead(userId);
      return res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
      console.error('markAllAsRead error:', err);
      return res.status(500).json({ success: false, message: 'Failed to mark all as read.' });
    }
  },

  /**
   * GET /api/notifications/consent-history
   * Retrieve immutable consent audit trail
   */
  getConsentHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const history = await NotificationService.getConsentHistory(userId);
      return res.json({ success: true, consentHistory: history });
    } catch (err) {
      console.error('getConsentHistory error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve consent history.' });
    }
  },

  /**
   * POST /api/notifications/dispatch
   * Trigger / test dispatch a notification
   */
  dispatch: async (req, res) => {
    try {
      const { userId, title, message, type, isFocusMode, overrideQuietHours, referenceDate } = req.body;
      const targetUserId = userId || req.user.id;

      if (!title || !message) {
        return res.status(400).json({ success: false, message: 'Title and message are required.' });
      }

      const result = await NotificationService.dispatchNotification(targetUserId, {
        title,
        message,
        type,
        isFocusMode: Boolean(isFocusMode),
        overrideQuietHours: Boolean(overrideQuietHours),
        referenceDate: referenceDate ? new Date(referenceDate) : new Date()
      });

      return res.json({ success: true, ...result });
    } catch (err) {
      console.error('dispatch error:', err);
      return res.status(500).json({ success: false, message: 'Failed to dispatch notification.' });
    }
  }
};
