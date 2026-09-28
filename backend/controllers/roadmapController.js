// ============================================
// MindCare Backend — Therapy Roadmap Controller (PostgreSQL)
// ============================================

import { db } from '../models/db.js';

const TRACK_PRESETS = {
  'Mindful Foundations': [
    { id: 'm1', title: 'Complete first 3-minute mindful breath', completed: false },
    { id: 'm2', title: 'Log first evening mood reflection', completed: false },
    { id: 'm3', title: 'Create first encrypted thought journal', completed: false },
    { id: 'm4', title: 'Establish 3-day mindfulness streak', completed: false },
    { id: 'm5', title: 'Explore 5-4-3-2-1 Sensory Grounding', completed: false }
  ],
  'CBT for Overthinking': [
    { id: 'm1', title: 'Identify an automatic negative thought (ANT)', completed: false },
    { id: 'm2', title: 'Perform cognitive reframing exercise', completed: false },
    { id: 'm3', title: 'Practice thought postponement for 15 mins', completed: false },
    { id: 'm4', title: 'Log worry outcome vs feared prediction', completed: false }
  ],
  'Restorative Sleep & Calm': [
    { id: 'm1', title: 'Establish 10 PM digital wind-down routine', completed: false },
    { id: 'm2', title: 'Practice 4-7-8 relaxing breathing in bed', completed: false },
    { id: 'm3', title: 'Morning natural sunlight exposure (10 min)', completed: false },
    { id: 'm4', title: 'Maintain 5-day consistent sleep timing', completed: false }
  ]
};

export const roadmapController = {
  getRoadmap: async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await db.query('SELECT * FROM therapy_roadmaps WHERE user_id = $1', [userId]);

      let roadmap = result.rows[0];

      if (!roadmap) {
        const milestones = TRACK_PRESETS['Mindful Foundations'];
        const newRoadmapId = crypto.randomUUID();
        await db.query(`
          INSERT INTO therapy_roadmaps (id, user_id, active_track, milestones_json, current_stage_index, progress_percentage)
          VALUES ($1, $2, 'Mindful Foundations', $3, 0, 0)
        `, [newRoadmapId, userId, JSON.stringify(milestones)]);

        roadmap = {
          id: newRoadmapId,
          user_id: userId,
          active_track: 'Mindful Foundations',
          milestones_json: milestones,
          current_stage_index: 0,
          progress_percentage: 0
        };
      }

      const milestones = typeof roadmap.milestones_json === 'string'
        ? JSON.parse(roadmap.milestones_json)
        : roadmap.milestones_json;

      return res.json({
        success: true,
        roadmap: {
          id: roadmap.id,
          active_track: roadmap.active_track,
          milestones: milestones || [],
          current_stage_index: roadmap.current_stage_index,
          progress_percentage: roadmap.progress_percentage,
          updated_at: roadmap.updated_at
        },
        availableTracks: Object.keys(TRACK_PRESETS)
      });
    } catch (err) {
      console.error('Get roadmap error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving therapy roadmap.' });
    }
  },

  toggleMilestone: async (req, res) => {
    try {
      const userId = req.user.id;
      const { milestoneId } = req.params;

      const result = await db.query('SELECT * FROM therapy_roadmaps WHERE user_id = $1', [userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Roadmap not found.' });
      }

      const roadmap = result.rows[0];
      const milestones = typeof roadmap.milestones_json === 'string'
        ? JSON.parse(roadmap.milestones_json)
        : roadmap.milestones_json;

      const target = milestones.find(m => m.id === milestoneId);
      if (!target) {
        return res.status(404).json({ success: false, message: 'Milestone ID not found.' });
      }

      target.completed = !target.completed;
      if (target.completed) {
        target.completed_at = new Date().toISOString();
      } else {
        delete target.completed_at;
      }

      const completedCount = milestones.filter(m => m.completed).length;
      const progressPercentage = Math.round((completedCount / milestones.length) * 100);
      const currentStageIndex = Math.min(milestones.length - 1, completedCount);

      await db.query(`
        UPDATE therapy_roadmaps
        SET milestones_json = $1, progress_percentage = $2, current_stage_index = $3, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $4
      `, [JSON.stringify(milestones), progressPercentage, currentStageIndex, userId]);

      if (target.completed) {
        await db.query('UPDATE users SET mindfulness_score = mindfulness_score + 15 WHERE id = $1', [userId]);
      }

      return res.json({
        success: true,
        message: target.completed ? 'Milestone completed!' : 'Milestone marked incomplete.',
        milestone: target,
        progress_percentage: progressPercentage,
        current_stage_index: currentStageIndex
      });
    } catch (err) {
      console.error('Toggle milestone error:', err);
      return res.status(500).json({ success: false, message: 'Server error updating milestone.' });
    }
  },

  switchTrack: async (req, res) => {
    try {
      const userId = req.user.id;
      const { trackName } = req.body;

      if (!TRACK_PRESETS[trackName]) {
        return res.status(400).json({ success: false, message: 'Invalid track name.' });
      }

      const milestones = TRACK_PRESETS[trackName];
      await db.query(`
        UPDATE therapy_roadmaps
        SET active_track = $1, milestones_json = $2, current_stage_index = 0, progress_percentage = 0, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $3
      `, [trackName, JSON.stringify(milestones), userId]);

      return res.json({
        success: true,
        message: `Therapy track switched to ${trackName}.`,
        active_track: trackName,
        milestones
      });
    } catch (err) {
      console.error('Switch track error:', err);
      return res.status(500).json({ success: false, message: 'Server error switching therapy track.' });
    }
  }
};
