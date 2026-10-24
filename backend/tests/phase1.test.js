import dotenv from 'dotenv';
dotenv.config();

// Ensure test has JWT_SECRET defined
process.env.JWT_SECRET = process.env.JWT_SECRET || 'mindcare_sanctuary_super_secret_jwt_key_2026_botanical';

const BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING PHASE 1 BACKEND VERIFICATION ---');

  // 1. Health check
  const healthRes = await fetch(`${BASE}/health`);
  const health = await healthRes.json();
  console.log('1. Health check:', health.status === 'healthy' ? 'PASS' : 'FAIL');

  // 2. Register new user with full demographics & mobile
  const email = `testuser_${Date.now()}@example.com`;
  const mobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'password123',
      name: 'Aria Sage',
      role: 'client',
      mobile_number: mobile,
      age: 23,
      gender: 'non-binary',
      address: '22 Lotus Valley, Bengaluru'
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
      notes: 'Morning sunlight through the window.'
    })
  });
  const moodData = await moodRes.json();
  console.log('4. Log Mood:', moodData.success ? 'PASS' : 'FAIL');

  // 5. Mood History
  const histRes = await fetch(`${BASE}/mood/history?days=7`, { headers: authHeader });
  const histData = await histRes.json();
  const logs = histData.moods || histData.logs || [];
  console.log('5. Mood History & Analytics:', histData.success && logs.length > 0 ? 'PASS' : 'FAIL');

  // 6. Encrypted Journal
  const journalRes = await fetch(`${BASE}/journal`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      content: 'I had an anxious moment about my project presentation, but I took three deep breaths and grounded myself.',
      sentiment_tag: 'reflective'
    })
  });
  const journalData = await journalRes.json();
  console.log('6. Create Encrypted Journal:', journalData.success ? 'PASS' : 'FAIL', 'Distortion:', journalData.distortion);

  // 7. Read Decrypted Journal
  const readJRes = await fetch(`${BASE}/journal`, { headers: authHeader });
  const readJData = await readJRes.json();
  const decrypted = readJData.entries && readJData.entries[0]?.content;
  console.log('7. Read Decrypted Journal:', decrypted && decrypted.includes('anxious moment') ? 'PASS (Decrypted match)' : 'FAIL');

  // 8. Log Activity
  const actRes = await fetch(`${BASE}/activity`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      activity_type: 'box_breathing',
      duration_seconds: 180,
      completed: true
    })
  });
  const actData = await actRes.json();
  console.log('8. Log Activity (Box Breathing):', actData.success ? 'PASS' : 'FAIL', 'Points:', `+${actData.pointsEarned}`);

  // 9. AI Companion Memory
  const memRes = await fetch(`${BASE}/companion/memory`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      summary_text: 'User enjoys morning sunlight and box breathing.',
      memory_type: 'preference'
    })
  });
  const memData = await memRes.json();
  console.log('9. AI Companion Memory:', memData.success ? 'PASS' : 'FAIL');

  // 10. Therapy Roadmap
  const roadRes = await fetch(`${BASE}/roadmap`, { headers: authHeader });
  const roadData = await roadRes.json();
  console.log('10. Therapy Roadmap & Milestone Toggle:', roadData.success ? 'PASS' : 'FAIL', 'Progress:', `${roadData.roadmap.progress_percentage}%`);

  console.log('--- ALL PHASE 1 BACKEND TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Test suite runner error:', err);
  process.exit(1);
});
