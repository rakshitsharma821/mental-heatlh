// ============================================
// MindCare Backend — Community Sanctuary Controller
// ============================================

import { db } from '../models/db.js';

const PRESET_CIRCLES = [
  {
    id: 'circle_breath_quiet',
    title: 'Sanctuary of Gentle Stillness',
    description: 'A quiet circle focusing on breath pacing, down-regulation, and intentional screen pauses.',
    tags: ['breath', 'quiet', 'nature'],
    membersCount: 84
  },
  {
    id: 'circle_rhythm_sleep',
    title: 'Evening Calm & Restful Rhythm',
    description: 'Fellow travelers supporting each other in regular bedtime habits and peaceful evening wind-downs.',
    tags: ['sleep', 'journal', 'morning'],
    membersCount: 112
  },
  {
    id: 'circle_creative_compassion',
    title: 'Creative Growth & Kind Words',
    description: 'A warm space celebrating daily emotional growth, mindful creation, and treating ourselves with grace.',
    tags: ['creativity', 'compassion', 'journal'],
    membersCount: 67
  }
];

export const communityController = {
  getCircles: (req, res) => {
    return res.json({ success: true, circles: PRESET_CIRCLES });
  },

  getPosts: (req, res) => {
    const { circleId } = req.params;
    const postsMap = db.getCollection('communityPosts') || {};
    const posts = postsMap[circleId] || [
      { id: 'c1', author: 'Willow Seeker', text: 'Took 4 deep box breaths before starting my day today.', time: '12m ago', hearts: 6 },
      { id: 'c2', author: 'Morning Mist', text: 'Gentle reminder: you don’t have to finish everything right now.', time: '1h ago', hearts: 14 }
    ];
    return res.json({ success: true, posts });
  },

  createPost: (req, res) => {
    try {
      const { circleId } = req.params;
      const { text, author = 'Gentle Wanderer' } = req.body;
      const cleanText = (text || '').trim();

      if (!cleanText) {
        return res.status(400).json({ success: false, message: 'Message text is required.' });
      }

      const allData = db.read();
      if (!allData.communityPosts) allData.communityPosts = {};
      const currentList = allData.communityPosts[circleId] || [];

      const newPost = {
        id: 'enc_' + Date.now(),
        author: author.trim() || 'Gentle Wanderer',
        text: cleanText,
        time: 'Just now',
        hearts: 1
      };

      currentList.unshift(newPost);
      allData.communityPosts[circleId] = currentList;
      db.write(allData);

      return res.status(201).json({ success: true, post: newPost, posts: currentList });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to post encouragement.' });
    }
  },

  cheerPost: (req, res) => {
    try {
      const { circleId, postId } = req.params;
      const allData = db.read();
      if (!allData.communityPosts || !allData.communityPosts[circleId]) {
        return res.status(404).json({ success: false, message: 'Circle posts not found.' });
      }

      const list = allData.communityPosts[circleId];
      const updated = list.map(item => item.id === postId ? { ...item, hearts: item.hearts + 1 } : item);
      allData.communityPosts[circleId] = updated;
      db.write(allData);

      return res.json({ success: true, posts: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to cheer post.' });
    }
  }
};
