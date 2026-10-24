// ============================================
// MindCare Backend — Community Sanctuary Controller (Part 6)
// Safe, Opt-in, Anonymous Peer Circles & Support Pairs
// STRICT ZERO-LEAKAGE: Real user ID, email, real name, mood logs, and clinical records
// are NEVER exposed in community posts or peer interactions.
// ============================================

import crypto from 'crypto';
import { db } from '../models/db.js';
import { isCrisisIntent, HELPLINES } from '../../shared/safeLanguage.js';
import { COMMUNITY_CONFIG } from '../config/community.js';
const INDIA_HELPLINES = HELPLINES;

const ALIAS_ADJECTIVES = [
  'Gentle', 'Quiet', 'Calm', 'Mindful', 'Peaceful', 'Still', 'Patient',
  'Serene', 'Tranquil', 'Soft', 'Warm', 'Grounded', 'Sunlit', 'Restful'
];

const ALIAS_NOUNS = [
  'Fern', 'Brook', 'Cedar', 'Willow', 'Sprout', 'Breeze', 'River', 'Otter',
  'Meadow', 'Leaf', 'Forest', 'Pebble', 'Haven', 'Pine', 'Horizon', 'Robin'
];

function generateGentleAlias() {
  const adj = ALIAS_ADJECTIVES[Math.floor(Math.random() * ALIAS_ADJECTIVES.length)];
  const noun = ALIAS_NOUNS[Math.floor(Math.random() * ALIAS_NOUNS.length)];
  const num = Math.floor(Math.random() * 899 + 100);
  return `${adj} ${noun} ${num}`;
}

export const communityController = {
  /**
   * Get authenticated user's anonymous community profile
   */
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await db.query(
        'SELECT anonymous_alias, avatar_seed, opt_in_community, intention_tags, created_at FROM community_profiles WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        const tags = Array.isArray(row.intention_tags)
          ? row.intention_tags
          : JSON.parse(row.intention_tags || '["Mindfulness", "Sleep Routine"]');

        return res.json({
          success: true,
          profile: {
            anonymous_alias: row.anonymous_alias,
            avatar_seed: row.avatar_seed,
            opt_in_community: Boolean(row.opt_in_community),
            intention_tags: tags,
            created_at: row.created_at
          }
        });
      }

      // Generate initial anonymous profile
      const newAlias = generateGentleAlias();
      const avatarSeed = 'seed_' + crypto.randomUUID().slice(0, 8);
      const defaultTags = ['Mindfulness', 'Sleep Routine'];
      const profileId = 'cp_' + crypto.randomUUID().slice(0, 16);

      await db.query(`
        INSERT INTO community_profiles (id, user_id, anonymous_alias, avatar_seed, opt_in_community, intention_tags)
        VALUES ($1, $2, $3, $4, FALSE, $5)
        ON CONFLICT (user_id) DO NOTHING
      `, [profileId, userId, newAlias, avatarSeed, JSON.stringify(defaultTags)]);

      return res.json({
        success: true,
        profile: {
          anonymous_alias: newAlias,
          avatar_seed: avatarSeed,
          opt_in_community: false,
          intention_tags: defaultTags
        }
      });
    } catch (err) {
      console.error('getProfile error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve community profile.' });
    }
  },

  /**
   * Update anonymous community profile (alias, avatar, opt-in, intention tags)
   */
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { anonymous_alias, avatar_seed, opt_in_community, intention_tags } = req.body;

      if (anonymous_alias && (anonymous_alias.trim().length < 3 || anonymous_alias.trim().length > 40)) {
        return res.status(400).json({
          success: false,
          message: 'Anonymous alias must be between 3 and 40 characters.'
        });
      }

      const cleanAlias = anonymous_alias ? anonymous_alias.trim() : generateGentleAlias();
      const cleanSeed = avatar_seed ? avatar_seed.trim() : 'seed_default';
      const cleanOptIn = Boolean(opt_in_community);
      const cleanTags = Array.isArray(intention_tags) ? intention_tags : ['Mindfulness'];

      // Ensure alias is not taken by another user
      const existingAlias = await db.query(
        'SELECT user_id FROM community_profiles WHERE anonymous_alias = $1 AND user_id != $2',
        [cleanAlias, userId]
      );

      if (existingAlias.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This anonymous alias is already chosen by another member. Please choose another.'
        });
      }

      const profileId = 'cp_' + crypto.randomUUID().slice(0, 16);
      const result = await db.query(`
        INSERT INTO community_profiles (id, user_id, anonymous_alias, avatar_seed, opt_in_community, intention_tags)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) DO UPDATE SET
          anonymous_alias = EXCLUDED.anonymous_alias,
          avatar_seed = EXCLUDED.avatar_seed,
          opt_in_community = EXCLUDED.opt_in_community,
          intention_tags = EXCLUDED.intention_tags
        RETURNING anonymous_alias, avatar_seed, opt_in_community, intention_tags;
      `, [profileId, userId, cleanAlias, cleanSeed, cleanOptIn, JSON.stringify(cleanTags)]);

      const row = result.rows[0];
      return res.json({
        success: true,
        message: 'Community sanctuary profile successfully updated.',
        profile: {
          anonymous_alias: row.anonymous_alias,
          avatar_seed: row.avatar_seed,
          opt_in_community: Boolean(row.opt_in_community),
          intention_tags: typeof row.intention_tags === 'string' ? JSON.parse(row.intention_tags) : row.intention_tags
        }
      });
    } catch (err) {
      console.error('updateProfile error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update community profile.' });
    }
  },

  /**
   * Get all thematic community circles
   */
  getCircles: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT cc.id, cc.title, cc.description,
               COUNT(cp.id) FILTER (WHERE cp.status = 'visible') as post_count
        FROM community_circles cc
        LEFT JOIN community_posts cp ON cc.id = cp.circle_id
        GROUP BY cc.id, cc.title, cc.description
        ORDER BY cc.id ASC
      `);

      return res.json({
        success: true,
        circles: result.rows.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          postCount: parseInt(r.post_count, 10) || 0
        }))
      });
    } catch (err) {
      console.error('getCircles error:', err);
      return res.status(500).json({ success: false, message: 'Failed to load community circles.' });
    }
  },

  /**
   * Get posts for a specific circle (strictly anonymous: ZERO user IDs or emails leaked)
   */
  getPosts: async (req, res) => {
    try {
      const { circleId } = req.params;
      const currentUserId = req.user?.id || null;

      const result = await db.query(`
        SELECT cp.id, cp.circle_id, cp.author_alias, cp.post_text, cp.heart_count,
               cp.is_facilitator, cp.created_at,
               COALESCE(cprof.avatar_seed, 'seed_sanctuary') as avatar_seed,
               CASE 
                 WHEN $2::varchar IS NOT NULL THEN EXISTS(SELECT 1 FROM post_hearts ph WHERE ph.post_id = cp.id AND ph.user_id = $2)
                 ELSE FALSE
               END as has_hearted
        FROM community_posts cp
        LEFT JOIN community_profiles cprof ON cp.author_alias = cprof.anonymous_alias
        WHERE cp.circle_id = $1 AND cp.status = 'visible'
        ORDER BY cp.created_at DESC
        LIMIT 50
      `, [circleId, currentUserId]);

      return res.json({
        success: true,
        posts: result.rows.map(p => ({
          id: p.id,
          circleId: p.circle_id,
          author: p.author_alias,
          avatarSeed: p.avatar_seed,
          text: p.post_text,
          hearts: parseInt(p.heart_count, 10) || 0,
          hasHearted: Boolean(p.has_hearted),
          isFacilitator: Boolean(p.is_facilitator),
          createdAt: p.created_at
        }))
      });
    } catch (err) {
      console.error('getPosts error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch circle posts.' });
    }
  },

  /**
   * Create an encouragement post with safe language filter & crisis detection
   */
  createPost: async (req, res) => {
    try {
      const userId = req.user.id;
      const { circleId } = req.params;
      const { text } = req.body;

      const cleanText = (text || '').trim();
      if (!cleanText) {
        return res.status(400).json({ success: false, message: 'Encouragement message cannot be empty.' });
      }

      if (cleanText.length > 500) {
        return res.status(400).json({ success: false, message: 'Message exceeds 500 character sanctuary limit.' });
      }

      // Check user opt-in status and fetch anonymous alias
      const profileRes = await db.query(
        'SELECT anonymous_alias, avatar_seed, opt_in_community FROM community_profiles WHERE user_id = $1',
        [userId]
      );

      if (profileRes.rows.length === 0 || !profileRes.rows[0].opt_in_community) {
        return res.status(403).json({
          success: false,
          message: 'Please opt-in to Community Sanctuary in your Community Profile before sharing reflections.'
        });
      }

      const authorAlias = profileRes.rows[0].anonymous_alias;
      const avatarSeed = profileRes.rows[0].avatar_seed;

      // 1. Crisis / Self-Harm safety detection
      if (isCrisisIntent(cleanText)) {
        // Record anonymized crisis event
        await db.query(
          "INSERT INTO crisis_events (id, trigger_type, triggered_at) VALUES ($1, 'community_post_crisis_trigger', CURRENT_TIMESTAMP)",
          ['ce_' + crypto.randomUUID().slice(0, 16)]
        );

        return res.status(422).json({
          success: false,
          crisisDetected: true,
          message: 'We noticed words indicating acute emotional distress. Your well-being matters deeply. Please connect directly with dedicated support professionals.',
          helplines: INDIA_HELPLINES
        });
      }

      // 2. Check if author is an approved therapist (Facilitator)
      const therapistRes = await db.query(
        "SELECT tp.verification_status FROM therapist_profiles tp JOIN users u ON tp.user_id = u.id WHERE u.id = $1",
        [userId]
      );
      const isFacilitator = therapistRes.rows.length > 0 && therapistRes.rows[0].verification_status === 'approved';

      // 3. Insert post into community_posts
      const postId = 'post_' + crypto.randomUUID().slice(0, 16);
      const insertRes = await db.query(`
        INSERT INTO community_posts (id, circle_id, user_id, author_alias, post_text, heart_count, is_facilitator, status)
        VALUES ($1, $2, $3, $4, $5, 1, $6, 'visible')
        RETURNING id, circle_id, author_alias, post_text, heart_count, is_facilitator, created_at
      `, [postId, circleId, userId, authorAlias, cleanText, isFacilitator]);

      const post = insertRes.rows[0];

      return res.status(201).json({
        success: true,
        message: 'Your gentle encouragement has been shared with the circle.',
        post: {
          id: post.id,
          circleId: post.circle_id,
          author: post.author_alias,
          avatarSeed,
          text: post.post_text,
          hearts: 1,
          isFacilitator: Boolean(post.is_facilitator),
          createdAt: post.created_at
        }
      });
    } catch (err) {
      console.error('createPost error:', err);
      return res.status(500).json({ success: false, message: 'Failed to share post.' });
    }
  },

  /**
   * Heart / Cheer an encouragement post (idempotent per user)
   */
  heartPost: async (req, res) => {
    try {
      const userId = req.user.id;
      const { postId } = req.params;

      const existingHeart = await db.query(
        'SELECT id FROM post_hearts WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      let hearted = false;
      let newCount = 0;

      if (existingHeart.rows.length > 0) {
        // Remove heart
        await db.query('DELETE FROM post_hearts WHERE post_id = $1 AND user_id = $2', [postId, userId]);
        const updateRes = await db.query(`
          UPDATE community_posts
          SET heart_count = GREATEST(heart_count - 1, 0)
          WHERE id = $1
          RETURNING heart_count
        `, [postId]);
        newCount = updateRes.rows[0]?.heart_count || 0;
        hearted = false;
      } else {
        // Add heart
        await db.query(`
          INSERT INTO post_hearts (id, post_id, user_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (post_id, user_id) DO NOTHING
        `, ['ph_' + crypto.randomUUID().slice(0, 16), postId, userId]);

        const updateRes = await db.query(`
          UPDATE community_posts
          SET heart_count = heart_count + 1
          WHERE id = $1
          RETURNING heart_count
        `, [postId]);
        newCount = updateRes.rows[0]?.heart_count || 1;
        hearted = true;
      }

      return res.json({
        success: true,
        hearted,
        hearts: newCount
      });
    } catch (err) {
      console.error('heartPost error:', err);
      return res.status(500).json({ success: false, message: 'Failed to react to post.' });
    }
  },

  /**
   * Report an inappropriate post for moderation
   */
  reportPost: async (req, res) => {
    try {
      const reporterId = req.user.id;
      const { postId } = req.params;
      const { reason = 'Inappropriate content' } = req.body;

      const postRes = await db.query('SELECT id, report_count FROM community_posts WHERE id = $1', [postId]);
      if (postRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Post not found.' });
      }

      const reportId = 'rep_' + crypto.randomUUID().slice(0, 16);
      await db.query(`
        INSERT INTO post_reports (id, post_id, reporter_id, reason, status)
        VALUES ($1, $2, $3, $4, 'pending')
      `, [reportId, postId, reporterId, reason.trim()]);

      // Increment report count; flag if threshold reached
      await db.query(`
        UPDATE community_posts
        SET report_count = report_count + 1,
            status = CASE WHEN report_count + 1 >= 3 THEN 'flagged' ELSE status END
        WHERE id = $1
      `, [postId]);

      return res.json({
        success: true,
        message: 'Thank you for keeping our sanctuary safe. This reflection has been submitted for moderation.'
      });
    } catch (err) {
      console.error('reportPost error:', err);
      return res.status(500).json({ success: false, message: 'Failed to submit report.' });
    }
  },

  // ============================================
  // Peer Support Matching (Opt-In & Anonymous)
  // ============================================

  /**
   * Request peer match based on shared wellness intentions
   */
  requestPeerMatch: async (req, res) => {
    try {
      // Feature flag guard: 1-on-1 peer matching is disabled by default
      if (!COMMUNITY_CONFIG.enablePeerMatching && process.env.ENABLE_PEER_MATCHING !== 'true') {
        return res.status(403).json({
          success: false,
          featureDisabled: true,
          message: '1-on-1 peer matching is currently disabled while moderation safeguards are evaluated.'
        });
      }

      const userId = req.user.id;

      const myProfileRes = await db.query(
        'SELECT anonymous_alias, avatar_seed, opt_in_community, intention_tags FROM community_profiles WHERE user_id = $1',
        [userId]
      );

      if (myProfileRes.rows.length === 0 || !myProfileRes.rows[0].opt_in_community) {
        return res.status(403).json({
          success: false,
          message: 'Please opt-in to Community Sanctuary before requesting a peer match.'
        });
      }

      const myProfile = myProfileRes.rows[0];
      const myTags = Array.isArray(myProfile.intention_tags)
        ? myProfile.intention_tags
        : JSON.parse(myProfile.intention_tags || '[]');

      // Check if already in an active peer match
      const activeMatch = await db.query(`
        SELECT pm.*, 
               cpa.avatar_seed as avatar_a, cpb.avatar_seed as avatar_b
        FROM peer_matches pm
        LEFT JOIN community_profiles cpa ON pm.profile_a_alias = cpa.anonymous_alias
        LEFT JOIN community_profiles cpb ON pm.profile_b_alias = cpb.anonymous_alias
        WHERE (pm.user_a_id = $1 OR pm.user_b_id = $1) AND pm.status = 'active'
      `, [userId]);

      if (activeMatch.rows.length > 0) {
        const m = activeMatch.rows[0];
        const isUserA = m.user_a_id === userId;
        return res.json({
          success: true,
          matched: true,
          peer: {
            alias: isUserA ? m.profile_b_alias : m.profile_a_alias,
            avatarSeed: isUserA ? m.avatar_b : m.avatar_a,
            sharedIntention: m.matched_focus,
            matchedAt: m.matched_at
          }
        });
      }

      // Search candidate peers with overlapping intention tags
      const candidatesRes = await db.query(`
        SELECT cp.user_id, cp.anonymous_alias, cp.avatar_seed, cp.intention_tags
        FROM community_profiles cp
        WHERE cp.user_id != $1
          AND cp.opt_in_community = TRUE
          AND NOT EXISTS (
            SELECT 1 FROM peer_matches pm
            WHERE (pm.user_a_id = cp.user_id OR pm.user_b_id = cp.user_id)
              AND pm.status = 'active'
          )
          AND NOT EXISTS (
            SELECT 1 FROM peer_matches pm
            WHERE ((pm.user_a_id = $1 AND pm.user_b_id = cp.user_id) OR (pm.user_b_id = $1 AND pm.user_a_id = cp.user_id))
              AND pm.status = 'blocked'
          )
        ORDER BY cp.created_at DESC
      `, [userId]);

      let matchedCandidate = null;
      let sharedTag = myTags[0] || 'Mindfulness';

      for (const candidate of candidatesRes.rows) {
        const cTags = Array.isArray(candidate.intention_tags)
          ? candidate.intention_tags
          : JSON.parse(candidate.intention_tags || '[]');
        const overlap = myTags.find(t => cTags.includes(t));
        if (overlap) {
          matchedCandidate = candidate;
          sharedTag = overlap;
          break;
        }
      }

      if (matchedCandidate) {
        const matchId = 'pm_' + crypto.randomUUID().slice(0, 16);
        await db.query(`
          INSERT INTO peer_matches (id, user_a_id, user_b_id, profile_a_alias, profile_b_alias, matched_focus, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'active')
        `, [
          matchId,
          userId,
          matchedCandidate.user_id,
          myProfile.anonymous_alias,
          matchedCandidate.anonymous_alias,
          sharedTag
        ]);

        return res.json({
          success: true,
          matched: true,
          peer: {
            alias: matchedCandidate.anonymous_alias,
            avatarSeed: matchedCandidate.avatar_seed,
            sharedIntention: sharedTag,
            matchedAt: new Date().toISOString()
          }
        });
      }

      return res.json({
        success: true,
        matched: false,
        message: 'You are queued for kindred peer matching. You will be paired once a traveler with matching intentions joins.'
      });
    } catch (err) {
      console.error('requestPeerMatch error:', err);
      return res.status(500).json({ success: false, message: 'Failed to request peer match.' });
    }
  },

  /**
   * Check active peer match status
   */
  getPeerMatchStatus: async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await db.query(`
        SELECT pm.*,
               cpa.avatar_seed as avatar_a, cpb.avatar_seed as avatar_b
        FROM peer_matches pm
        LEFT JOIN community_profiles cpa ON pm.profile_a_alias = cpa.anonymous_alias
        LEFT JOIN community_profiles cpb ON pm.profile_b_alias = cpb.anonymous_alias
        WHERE (pm.user_a_id = $1 OR pm.user_b_id = $1) AND pm.status = 'active'
      `, [userId]);

      if (result.rows.length === 0) {
        return res.json({ success: true, hasMatch: false });
      }

      const m = result.rows[0];
      const isUserA = m.user_a_id === userId;

      return res.json({
        success: true,
        hasMatch: true,
        match: {
          id: m.id,
          peerAlias: isUserA ? m.profile_b_alias : m.profile_a_alias,
          peerAvatarSeed: isUserA ? m.avatar_b : m.avatar_a,
          sharedIntention: m.matched_focus,
          matchedAt: m.matched_at
        }
      });
    } catch (err) {
      console.error('getPeerMatchStatus error:', err);
      return res.status(500).json({ success: false, message: 'Failed to get peer match status.' });
    }
  },

  /**
   * Conclude / leave active peer match safely
   */
  leavePeerMatch: async (req, res) => {
    try {
      const userId = req.user.id;
      await db.query(`
        UPDATE peer_matches
        SET status = 'concluded'
        WHERE (user_a_id = $1 OR user_b_id = $1) AND status = 'active'
      `, [userId]);

      return res.json({
        success: true,
        message: 'Peer match concluded peacefully. You can request a new kindred traveler anytime.'
      });
    } catch (err) {
      console.error('leavePeerMatch error:', err);
      return res.status(500).json({ success: false, message: 'Failed to leave peer match.' });
    }
  },

  /**
   * Admin feature flag toggle for peer matching
   */
  setFeatureFlag: async (req, res) => {
    try {
      const caller = req.user;
      if (!caller || (caller.role !== 'admin' && caller.role !== 'super_admin')) {
        return res.status(403).json({ success: false, message: 'Admin access required.' });
      }

      const { enablePeerMatching } = req.body;
      const isProd = (process.env.NODE_ENV || '').trim() === 'production' || req.headers['x-test-env'] === 'production';
      const envAllowed = process.env.ENABLE_PEER_MATCHING === 'true';

      if (enablePeerMatching === true && isProd && !envAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Cannot enable peer matching in production unless ENABLE_PEER_MATCHING=true in environment configuration.'
        });
      }

      if (typeof enablePeerMatching === 'boolean') {
        COMMUNITY_CONFIG.setPeerMatching(enablePeerMatching);

        // Audit log action to admin_audit_log
        await db.query(`
          INSERT INTO admin_audit_log (id, admin_id, action, target_type, target_id, details, ip, timestamp)
          VALUES ($1, $2, 'update_community_feature_flag', 'feature_flags', 'peer_matching', $3, $4, CURRENT_TIMESTAMP)
        `, [
          'aal_' + crypto.randomUUID().slice(0, 16),
          caller.id,
          JSON.stringify({ enablePeerMatching }),
          req.ip || '127.0.0.1'
        ]).catch(() => {});
      }

      return res.json({
        success: true,
        enablePeerMatching: COMMUNITY_CONFIG.enablePeerMatching
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update feature flag.' });
    }
  },

  /**
   * Block peer match and permanently unpair
   */
  blockPeerMatch: async (req, res) => {
    try {
      const userId = req.user.id;
      const { peerAlias } = req.body || {};

      await db.query(`
        UPDATE peer_matches
        SET status = 'blocked'
        WHERE (user_a_id = $1 OR user_b_id = $1)
          AND (profile_a_alias = $2 OR profile_b_alias = $2 OR $2 IS NULL)
          AND status = 'active'
      `, [userId, peerAlias || null]);

      return res.json({
        success: true,
        message: 'Peer has been blocked and safely uncoupled from your sanctuary journey.'
      });
    } catch (err) {
      console.error('blockPeerMatch error:', err);
      return res.status(500).json({ success: false, message: 'Failed to block peer match.' });
    }
  }
};
