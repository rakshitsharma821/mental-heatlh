// ============================================
// MindCare — Hardcoded Data & Secrets Auditor
// ============================================

import fs from 'fs';
import path from 'path';

const findings = [];

function checkFile(filePath) {
  if (
    filePath.includes('node_modules') ||
    filePath.includes('.git') ||
    filePath.includes('dist') ||
    filePath.includes('.history') ||
    filePath.includes('fixtures') ||
    filePath.includes('auditHardcoded.js') ||
    filePath.includes('checkHardcoded.js')
  ) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(process.cwd(), filePath);

  // 1. JWT_SECRET or ENCRYPTION_KEY hardcoded fallback
  if (/JWT_SECRET\s*\|\|\s*['"][^'"]+['"]/.test(content) && !relPath.includes('tests')) {
    findings.push({
      file: relPath,
      issue: 'Hardcoded JWT_SECRET fallback string literal',
      target: 'Must throw error if missing from env in production/app',
      priority: 'HIGH'
    });
  }

  if (/ENCRYPTION_KEY\s*\|\|\s*['"][^'"]+['"]/.test(content) && !relPath.includes('tests')) {
    findings.push({
      file: relPath,
      issue: 'Hardcoded ENCRYPTION_KEY fallback string literal',
      target: 'Must read from process.env.ENCRYPTION_KEY only',
      priority: 'HIGH'
    });
  }

  // 2. Hardcoded seeded users or admin password in pgDb.js
  if (relPath.includes('pgDb.js') && content.includes('scrypt_demo_hash')) {
    findings.push({
      file: relPath,
      issue: 'Hardcoded seeded admin or clinician credentials in DB schema init',
      target: 'Move to backend/scripts/seedAdmin.js and seedDemoClinician.js',
      priority: 'HIGH'
    });
  }

  // 3. Fallback database passwords
  if (/Rakshit@123/.test(content) && !relPath.includes('.env')) {
    findings.push({
      file: relPath,
      issue: 'Hardcoded DB_PASSWORD fallback in code',
      target: 'Remove fallback; require process.env.DB_PASSWORD',
      priority: 'HIGH'
    });
  }

  // 4. Hardcoded localhost URLs in components/services (outside config/env)
  if (
    /['"]http:\/\/localhost:\d+['"]/.test(content) &&
    !relPath.includes('tests') &&
    !relPath.includes('server.js') &&
    !relPath.includes('constants.js') &&
    !relPath.includes('appConfig.js') &&
    !relPath.includes('.env') &&
    !relPath.includes('vite.config')
  ) {
    findings.push({
      file: relPath,
      issue: 'Hardcoded localhost URL string literal',
      target: 'Use VITE_API_BASE_URL or app config',
      priority: 'MEDIUM'
    });
  }

  // 5. DEMO access code or pairing key hardcoded in UI
  if (/['"]DEMO['"]/.test(content) && relPath.includes('TherapistDashboard')) {
    findings.push({
      file: relPath,
      issue: 'Hardcoded "DEMO" code gate in TherapistDashboard',
      target: 'Remove gate; enforce role + approved status from backend',
      priority: 'HIGH'
    });
  }
}

function traverse(dir) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      traverse(full);
    } else if (/\.(js|jsx|json)$/.test(entry)) {
      checkFile(full);
    }
  }
}

traverse('.');

console.log('=== HARDCODED DATA AUDIT FINDINGS ===');
console.table(findings);
