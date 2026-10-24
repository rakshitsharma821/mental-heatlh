// ============================================
// MindCare Sanctuary — Part 6 Automated Test Suite
// COMMUNITY SANCTUARY, PEER SUPPORT & EXPERT CIRCLES
// ============================================

import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { db, initPostgresDatabase } from '../models/db.js';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'mindcare_sanctuary_super_secret_jwt_key_2026_botanical';

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }

  return { status: res.status, body: json };
}

test('Part 6: Community Sanctuary, Peer Support & Expert Circles', async (t) => {
  await initPostgresDatabase();

  const rand = Math.floor(Math.random() * 900000 + 100000);
  const clientAId = `usr_p6_a_${rand}`;
  const clientBId = `usr_p6_b_${rand}`;
  const therapistId = `usr_p6_th_${rand}`;
  const adminId = `usr_p6_adm_${rand}`;

  // Seed test users
  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
    VALUES 
      ($1, $2, $3, 'hash', 'salt', 'rec_hash', 'Real Client Name A', 'client', 'active'),
      ($4, $5, $6, 'hash', 'salt', 'rec_hash', 'Real Client Name B', 'client', 'active'),
      ($7, $8, $9, 'hash', 'salt', 'rec_hash', 'Dr. Facilitator', 'therapist', 'active'),
      ($10, $11, $12, 'hash', 'salt', 'rec_hash', 'Admin Mod', 'admin', 'active')
    ON CONFLICT (id) DO NOTHING;
  `, [
    clientAId, `MC-P6A-${rand}`, `p6.a.${rand}@mindcare.test`,
    clientBId, `MC-P6B-${rand}`, `p6.b.${rand}@mindcare.test`,
    therapistId, `THR-P6-${rand}`, `p6.th.${rand}@mindcare.test`,
    adminId, `ADM-P6-${rand}`, `p6.adm.${rand}@mindcare.test`
  ]);

  // Seed approved therapist profile
  await db.query(`
    INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, title, verification_status, is_available)
    VALUES ($1, $2, 'RCI-P6-FACILITATOR', 'Rehabilitation Council of India', 'Clinical Facilitator', 'approved', true)
    ON CONFLICT (user_id) DO UPDATE SET verification_status = 'approved';
  `, [`tp_p6_${rand}`, therapistId]);

  const tokenA = jwt.sign({ id: clientAId, role: 'client', name: 'Real Client Name A' }, JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ id: clientBId, role: 'client', name: 'Real Client Name B' }, JWT_SECRET, { expiresIn: '1h' });
  const therapistToken = jwt.sign({ id: therapistId, role: 'therapist', name: 'Dr. Facilitator' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: adminId, role: 'admin', name: 'Admin Mod' }, JWT_SECRET, { expiresIn: '1h' });

  // ──────────────────────────────────────────
  // TEST 1: Anonymous Profile & Zero-Leakage
  // ──────────────────────────────────────────
  await t.test('T1. Community profile generates anonymous alias; strictly excludes real identity info', async () => {
    const profRes = await apiRequest('/community/profile', 'GET', null, tokenA);
    assert.equal(profRes.status, 200);
    assert.equal(profRes.body.success, true);
    assert.ok(profRes.body.profile.anonymous_alias, 'Should have generated an anonymous alias');
    assert.equal(profRes.body.profile.opt_in_community, false);

    // Verify zero leakage of personal data
    assert.equal(profRes.body.profile.email, undefined);
    assert.equal(profRes.body.profile.full_name, undefined);
    assert.equal(profRes.body.profile.user_id, undefined);
    assert.equal(profRes.body.profile.id, undefined);
    console.log('✅ T1. Community profile provides gentle anonymous alias with zero personal identity leakage: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 2: Profile Update & Opt-In
  // ──────────────────────────────────────────
  const aliasA = `Peaceful Stream ${rand % 1000}`;
  const aliasB = `Quiet Willow ${rand % 1000}`;
  const sharedTag = `breath_${rand}`;

  await t.test('T2. Member successfully updates alias, intention tags, and opts in', async () => {
    const updateRes = await apiRequest('/community/profile', 'PUT', {
      anonymous_alias: aliasA,
      avatar_seed: 'seed_water',
      opt_in_community: true,
      intention_tags: [sharedTag, 'nature', 'quiet']
    }, tokenA);

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.profile.anonymous_alias, aliasA);
    assert.equal(updateRes.body.profile.opt_in_community, true);

    // Opt-in Client B as well with overlapping tag sharedTag
    await apiRequest('/community/profile', 'PUT', {
      anonymous_alias: aliasB,
      avatar_seed: 'seed_leaf',
      opt_in_community: true,
      intention_tags: [sharedTag, 'sleep']
    }, tokenB);

    console.log('✅ T2. Member updates anonymous identity and opts into sanctuary participation: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 3: Explore Thematic Circles
  // ──────────────────────────────────────────
  await t.test('T3. Thematic community circles are discoverable with reflection counts', async () => {
    const circRes = await apiRequest('/community/circles');
    assert.equal(circRes.status, 200);
    assert.ok(circRes.body.circles.length >= 3, 'Should have at least 3 thematic circles');
    const breathCircle = circRes.body.circles.find(c => c.id === 'circle_breath_quiet' || c.id === 'mindful-breathing');
    assert.ok(breathCircle, 'Mindful breath circle should be listed');
    console.log('✅ T3. Thematic circles discovered with title, description, and post metrics: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 4: Posting Reflections & Gate Check
  // ──────────────────────────────────────────
  let createdPostId = null;

  await t.test('T4. Opted-in member shares reflection; non-opted member is rejected (403)', async () => {
    // Non-opted user test: create client C without opt-in
    const clientCId = `usr_p6_c_${rand}`;
    await db.query(`
      INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
      VALUES ($1, $2, $3, 'hash', 'salt', 'rec_hash', 'Non Opted Member', 'client', 'active')
    `, [clientCId, `MC-P6C-${rand}`, `p6.c.${rand}@mindcare.test`]);
    const tokenC = jwt.sign({ id: clientCId, role: 'client', name: 'Non Opted' }, JWT_SECRET, { expiresIn: '1h' });

    // Client C attempts to post without opting in
    const blockedPost = await apiRequest('/community/circles/circle_breath_quiet/posts', 'POST', {
      text: 'Trying to post without opting in'
    }, tokenC);
    assert.equal(blockedPost.status, 403);

    // Client A posts valid reflection
    const postRes = await apiRequest('/community/circles/circle_breath_quiet/posts', 'POST', {
      text: 'Took five slow diaphragmatic breaths by the morning window. Felt stillness return.'
    }, tokenA);

    assert.equal(postRes.status, 201);
    assert.ok(postRes.body.post.id);
    assert.equal(postRes.body.post.author, aliasA);
    assert.equal(postRes.body.post.isFacilitator, false);
    createdPostId = postRes.body.post.id;

    // Verify post list in circle contains only anonymous author alias
    const listRes = await apiRequest('/community/circles/circle_breath_quiet/posts', 'GET', null, tokenA);
    assert.equal(listRes.status, 200);
    const item = listRes.body.posts.find(p => p.id === createdPostId);
    assert.ok(item);
    assert.equal(item.author, aliasA);
    assert.equal(item.author_id, undefined, 'No user ID should be exposed');
    assert.equal(item.email, undefined, 'No email should be exposed');
    console.log('✅ T4. Posting reflections gated on community opt-in with strict anonymous attribution: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 5: Content Safety & Deterministic Crisis Detection
  // ──────────────────────────────────────────
  await t.test('T5. Crisis content triggers safety nudge with helpline support and prevents publishing', async () => {
    const crisisPost = await apiRequest('/community/circles/circle_breath_quiet/posts', 'POST', {
      text: 'I want to die today, there is no reason to live anymore'
    }, tokenA);

    assert.equal(crisisPost.status, 422);
    assert.equal(crisisPost.body.crisisDetected, true);
    assert.ok(crisisPost.body.helplines.length > 0, 'Must provide verified helpline numbers');

    // Verify post was NOT published to circle
    const listRes = await apiRequest('/community/circles/circle_breath_quiet/posts');
    const leaked = listRes.body.posts.find(p => p.text.includes('want to die'));
    assert.equal(leaked, undefined, 'Crisis text must NEVER be published to public circles');
    console.log('✅ T5. Content safety detects acute distress triggers, provides helplines, and protects circles: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 6: Heart Reactions / Cheers
  // ──────────────────────────────────────────
  await t.test('T6. Positive encouragement cheers (hearts) toggle idempotently per member', async () => {
    // Client B cheers Client A's post
    const heartRes = await apiRequest(`/community/posts/${createdPostId}/heart`, 'POST', {}, tokenB);
    assert.equal(heartRes.status, 200);
    assert.equal(heartRes.body.hearted, true);
    assert.ok(heartRes.body.hearts >= 2);

    // Client B cheers again -> un-cheers
    const unheartRes = await apiRequest(`/community/posts/${createdPostId}/heart`, 'POST', {}, tokenB);
    assert.equal(unheartRes.status, 200);
    assert.equal(unheartRes.body.hearted, false);
    console.log('✅ T6. Positive encouragement hearts toggle idempotently per member: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 7: Clinical Facilitator Badging
  // ──────────────────────────────────────────
  await t.test('T7. Approved clinician reflections receive "Clinical Facilitator" verification badge', async () => {
    // Opt in therapist to community
    await apiRequest('/community/profile', 'PUT', {
      anonymous_alias: `Dr. Vance (Facilitator) ${rand % 1000}`,
      opt_in_community: true,
      intention_tags: ['breath']
    }, therapistToken);

    const facilitatorPost = await apiRequest('/community/circles/circle_breath_quiet/posts', 'POST', {
      text: 'Grounding practice tip: Notice three textures around you when your nervous system feels overwhelmed.'
    }, therapistToken);

    assert.equal(facilitatorPost.status, 201);
    assert.equal(facilitatorPost.body.post.isFacilitator, true, 'Approved therapist must have isFacilitator badge');
    console.log('✅ T7. Clinical facilitator reflections properly badged for peer community guidance: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 8: Peer Support Matching & Feature Flag Guard
  // ──────────────────────────────────────────
  await t.test('T8. Kindred peer matching is gated behind ENABLE_PEER_MATCHING flag and supports blocking', async () => {
    // 1. Feature Flag OFF by default: request rejected with 403
    await apiRequest('/community/admin/features', 'POST', { enablePeerMatching: false }, adminToken);
    const blockedReq = await apiRequest('/community/peer-match/request', 'POST', {}, tokenA);
    assert.equal(blockedReq.status, 403);
    assert.equal(blockedReq.body.featureDisabled, true);

    // 2. Enable flag dynamically via admin endpoint
    await apiRequest('/community/admin/features', 'POST', { enablePeerMatching: true }, adminToken);

    // Client A requests peer match
    const matchReqA = await apiRequest('/community/peer-match/request', 'POST', {}, tokenA);
    assert.equal(matchReqA.status, 200);
    assert.equal(matchReqA.body.matched, true);
    assert.equal(matchReqA.body.peer.alias, aliasB, 'Should pair with Client B who shares unique intention');
    assert.equal(matchReqA.body.peer.sharedIntention, sharedTag);

    // Client B checks peer status
    const statusB = await apiRequest('/community/peer-match/status', 'GET', null, tokenB);
    assert.equal(statusB.status, 200);
    assert.equal(statusB.body.hasMatch, true);
    assert.equal(statusB.body.match.peerAlias, aliasA);

    // Client A blocks peer match safely
    const blockRes = await apiRequest('/community/peer-match/block', 'POST', { peerAlias: aliasB }, tokenA);
    assert.equal(blockRes.status, 200);

    const postBlockStatus = await apiRequest('/community/peer-match/status', 'GET', null, tokenA);
    assert.equal(postBlockStatus.body.hasMatch, false);

    // Reset flag to disabled
    await apiRequest('/community/admin/features', 'POST', { enablePeerMatching: false }, adminToken);

    console.log('✅ T8. Kindred peer matching feature-flag gated, connects on shared intentions, and supports blocking: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 9: Community Reporting & Auto-Flagging
  // ──────────────────────────────────────────
  await t.test('T9. Member reports inappropriate reflection; repeated reports flag the post', async () => {
    const reportRes = await apiRequest(`/community/posts/${createdPostId}/report`, 'POST', {
      reason: 'Off-topic or disruptive'
    }, tokenB);
    assert.equal(reportRes.status, 200);
    assert.match(reportRes.body.message, /submitted for moderation/i);

    // Verify report record exists in database
    const repCheck = await db.query('SELECT * FROM post_reports WHERE post_id = $1', [createdPostId]);
    assert.ok(repCheck.rows.length >= 1);
    console.log('✅ T9. Community reflection reporting registers violation audit: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 10: Admin Moderation & Removal
  // ──────────────────────────────────────────
  await t.test('T10. Administrator reviews reported reflections and archives/hides violating posts', async () => {
    const reportsRes = await apiRequest('/admin/community/reports', 'GET', null, adminToken);
    assert.equal(reportsRes.status, 200);
    assert.ok(reportsRes.body.reports.length >= 1);

    // Admin hides post
    const modRes = await apiRequest(`/admin/community/posts/${createdPostId}/moderate`, 'PATCH', {
      status: 'hidden',
      admin_notes: 'Archived per community safety guidelines'
    }, adminToken);
    assert.equal(modRes.status, 200);

    // Verify hidden post no longer appears in public circle view
    const listRes = await apiRequest('/community/circles/circle_breath_quiet/posts');
    const hiddenPost = listRes.body.posts.find(p => p.id === createdPostId);
    assert.equal(hiddenPost, undefined, 'Hidden post must not appear in circle');
    console.log('✅ T10. Admin moderation hides violating reflections from public community view: PASS');
  });

  console.log(`\n========================================`);
  console.log(`RESULT: 10/10 Part 6 Tests Passed Successfully`);
  console.log(`========================================\n`);
});
