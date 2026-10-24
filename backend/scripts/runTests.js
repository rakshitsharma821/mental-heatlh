// ============================================
// MindCare Sanctuary — Test Suite Runner & Database Isolator
// Strictly guarantees tests execute against an isolated test database (ends with _test)
// 1. Refuses execution if database name does not end with _test
// 2. Creates and migrates the test database before the run
// 3. Spawns the backend server bound to the test database
// 4. Executes node:test suites
// 5. Cleans test database and shuts down server upon completion
// ============================================

import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '..');

function freePort(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
    const lines = out.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && pid !== String(process.pid)) {
        try { execSync(`taskkill /F /PID ${pid}`); } catch (_) {}
      }
    }
  } catch (_) {}
}

async function main() {
  const testDbName = process.env.TEST_DB_NAME || 'mindcare_test';

  console.log(`\n========================================================`);
  console.log(`🧪 MINDCARE ISOLATED TEST RUNNER`);
  console.log(`   Target Database: [${testDbName}]`);
  console.log(`========================================================\n`);

  // Enforce root naming rule
  if (!testDbName.endsWith('_test')) {
    console.error(`❌ SECURITY VIOLATION: Test database name must end with "_test". Refusing to run tests against: "${testDbName}"`);
    process.exit(1);
  }

  process.env.NODE_ENV = 'test';
  process.env.TEST_DB_NAME = testDbName;
  process.env.PORT = process.env.PORT || '5000';

  // 1. Initialize and migrate the test database
  console.log(`📦 Initializing test database [${testDbName}]...`);
  const { initPostgresDatabase, cleanTestDatabase } = await import('../models/db.js');
  await initPostgresDatabase();

  console.log(`🧹 Cleaning test database before test run...`);
  await cleanTestDatabase();

  // 2. Start backend server bound to test database
  const port = process.env.PORT || '5000';
  freePort(port);
  console.log(`🚀 Launching MindCare Backend server on port ${port} bound to [${testDbName}]...`);
  const serverProcess = spawn('node', ['server.js'], {
    cwd: backendDir,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      TEST_DB_NAME: testDbName,
      PORT: process.env.PORT
    },
    stdio: ['inherit', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', (d) => {
    const s = d.toString();
    if (s.includes('running on port') || s.includes('error') || s.includes('Error')) {
      process.stdout.write(`[Server] ${s}`);
    }
  });

  serverProcess.stderr.on('data', (d) => {
    process.stderr.write(`[Server ERR] ${d.toString()}`);
  });

  // Wait for server to be responsive
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Determine which test files to run
  const args = process.argv.slice(2);
  const testTargets = args.length > 0
    ? args
    : ['tests/step0_verification.test.js', 'tests/part3_therapist_verification.test.js'];

  console.log(`\n📋 Running test files: ${testTargets.join(', ')}...\n`);

  const testRunner = spawn('node', ['--test', ...testTargets], {
    cwd: backendDir,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      TEST_DB_NAME: testDbName
    },
    stdio: 'inherit'
  });

  const exitCode = await new Promise((resolve) => {
    testRunner.on('close', (code) => resolve(code));
  });

  console.log(`\n========================================================`);
  console.log(`🏁 Test run finished with exit code: ${exitCode}`);
  console.log(`🧹 Cleaning test database [${testDbName}]...`);
  try {
    await cleanTestDatabase();
    console.log(`✅ Test database cleaned.`);
  } catch (err) {
    console.warn('Cleanup warning:', err.message);
  }

  serverProcess.kill('SIGTERM');
  console.log(`🛑 Test server stopped.`);
  console.log(`========================================================\n`);

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
