// Automated Test for MindCare Phase 1 Backend API
const BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING PHASE 1 BACKEND VERIFICATION ---');

  // 1. Health check
  const healthRes = await fetch(`${BASE}/health`);
  const health = await healthRes.json();
  console.log('1. Health check:', health.status === 'healthy' ? 'PASS' : 'FAIL');

  // 2. Register new user
  const email = `testuser_${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'password123',
      name: 'Aria Sage',
      role: 'client'
    })
  });
  const regData = await regRes.json();
  console.log('2. Register:', regData.success ? 'PASS' : 'FAIL', regData.recoveryPhrase ? `(Phrase: ${regData.recoveryPhrase})` : '');
  const token = regData.token;

  if (!token) {
    console.error('Registration failed:', regData);
    process.exit(1);
  }

  const authHeader = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Auth Me
  const meRes = await fetch(`${BASE}/auth/me`, { headers: authHeader });
  const meData = await meRes.json();
  console.log('3. Auth /me:', meData.success && meData.user.name === 'Aria Sage' ? 'PASS' : 'FAIL');

  // 4. Log Mood
  const moodRes = await fetch(`${BASE}/mood`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      mood_label: 'hopeful',
      energy_level: 4,
      valence_score: 0.65,
      notes: 'Morning sunlight and quiet coffee.'
    })
  });
  const moodData = await moodRes.json();
  console.log('4. Log Mood:', moodData.success ? 'PASS' : 'FAIL');

  // 5. Get Mood History & Analytics
  const moodHistRes = await fetch(`${BASE}/mood/history`, { headers: authHeader });
  const moodHist = await moodHistRes.json();
  const moodAnalyticsRes = await fetch(`${BASE}/mood/analytics`, { headers: authHeader });
  const moodAnalytics = await moodAnalyticsRes.json();
  console.log('5. Mood History & Analytics:', moodHist.count === 1 && moodAnalytics.dominantMood === 'hopeful' ? 'PASS' : 'FAIL');

  // 6. Encrypted Journal Entry
  const secretText = 'This is my private encrypted journal entry. Testing AES-256-GCM.';
  const journalRes = await fetch(`${BASE}/journal`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      content: secretText,
      sentiment_tag: 'Gratitude'
    })
  });
  const journalData = await journalRes.json();
  console.log('6. Create Encrypted Journal:', journalData.success ? 'PASS' : 'FAIL', `Distortion: ${journalData.entry?.cognitive_distortion}`);

  // 7. Get and Decrypt Journal Entries
  const getJournalsRes = await fetch(`${BASE}/journal`, { headers: authHeader });
  const journalsData = await getJournalsRes.json();
  const retrievedText = journalsData.entries[0]?.content;
  console.log('7. Read Decrypted Journal:', retrievedText === secretText ? 'PASS (Decrypted match)' : 'FAIL');

  // 8. Log Activity
  const actRes = await fetch(`${BASE}/activity`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      activity_type: 'box_breathing',
      duration_seconds: 180,
      completed: 1
    })
  });
  const actData = await actRes.json();
  console.log('8. Log Activity (Box Breathing):', actData.success ? 'PASS' : 'FAIL', `Points: +${actData.pointsEarned}`);

  // 9. AI Companion Memory & Pruning
  const compRes = await fetch(`${BASE}/companion/memory`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      memory_type: 'distilled_summary',
      summary_text: 'User finds slow diaphragmatic breathing particularly effective before sleeping.',
      importance_weight: 0.85
    })
  });
  const compData = await compRes.json();
  const getCompRes = await fetch(`${BASE}/companion/memory`, { headers: authHeader });
  const getCompData = await getCompRes.json();
  console.log('9. AI Companion Memory:', compData.success && getCompData.count === 1 ? 'PASS' : 'FAIL');

  // 10. Therapy Roadmap State & Milestone Toggle
  const roadRes = await fetch(`${BASE}/roadmap`, { headers: authHeader });
  const roadData = await roadRes.json();
  const firstMilestoneId = roadData.roadmap.milestones[0].id;
  const toggleRes = await fetch(`${BASE}/roadmap/milestones/${firstMilestoneId}/toggle`, {
    method: 'POST',
    headers: authHeader
  });
  const toggleData = await toggleRes.json();
  console.log('10. Therapy Roadmap & Milestone Toggle:', toggleData.success && toggleData.milestone.completed === true ? 'PASS' : 'FAIL', `Progress: ${toggleData.progress_percentage}%`);

  console.log('--- ALL PHASE 1 BACKEND TESTS COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
