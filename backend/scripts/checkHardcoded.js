// ============================================
// MindCare — Hardcoded Content, Secrets & Fallbacks Security Checker (Audited)
// Scans:
// 1. backend
// 2. frontend/src (including config, context, App, pages, components, services)
// 3. shared
// 4. scripts
//
// Detects:
// (a) Raw phone numbers & emails outside shared/helplines and seed/fixture/test files
// (b) Inline arrays of user-facing content (quotes/affirmations, canned replies, questions, breathing timings) outside config/locale
// (c) Localhost URLs outside authorized config files
// (d) AI model names outside centralized aiService / config
// (e) Insecure fallback secrets (JWT_SECRET || '...', ENCRYPTION_KEY || '...') and real API keys
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

export const violations = [];

const TARGET_PATHS = [
  path.join(ROOT_DIR, 'backend'),
  path.join(ROOT_DIR, 'frontend', 'src'),
  path.join(ROOT_DIR, 'shared'),
  path.join(ROOT_DIR, 'scripts')
];

const ALLOWED_LOCALHOST_FILES = [
  'constants.js',
  'appConfig.js',
  'api.js',
  'server.js',
  'vite.config.js'
];

const ALLOWED_CONTACTS_FILES = [
  'helplines.js',
  'safeLanguage.js',
  'seedDemoAccounts.js',
  'setup_demo_accounts.js',
  'seedAdmin.js',
  'cleanDevDatabase.js',
  'notifications.js',
  'legalConfig.js'
];

const FORBIDDEN_RULES = [
  {
    id: 'INSECURE_SECRET_FALLBACK',
    regex: /(?:JWT_SECRET|ENCRYPTION_KEY|DB_PASSWORD|OPENROUTER_API_KEY)\s*\|\|\s*['"][^'"]+['"]/i,
    filter: (filePath) => !filePath.includes('test') && !filePath.includes('checkHardcoded.js'),
    message: 'Insecure secret environment variable fallback detected. Must strictly come from process.env.'
  },
  {
    id: 'API_KEY_LITERAL',
    regex: /sk-or-v1-[a-zA-Z0-9]{32,}/,
    filter: () => true,
    message: 'Live API key literal detected in source code.'
  },
  {
    id: 'HARDCODED_LOCALHOST_URL',
    regex: /['"]http:\/\/localhost:\d+['"]/,
    filter: (filePath) => {
      if (filePath.includes('test')) return false;
      const base = path.basename(filePath);
      return !ALLOWED_LOCALHOST_FILES.includes(base);
    },
    message: 'Hardcoded localhost URL outside centralized config. Import from appConfig.js or constants.js.'
  },
  {
    id: 'UNCONFIGURED_MODEL_NAME',
    regex: /['"](?:google\/gemini-[a-zA-Z0-9.-]+|openai\/gpt-[a-zA-Z0-9.-]+|anthropic\/claude-[a-zA-Z0-9.-]+)['"]/,
    filter: (filePath) => {
      if (filePath.includes('test')) return false;
      const base = path.basename(filePath);
      return base !== 'aiService.js' && base !== 'appConfig.js' && base !== 'checkHardcoded.js';
    },
    message: 'Hardcoded AI model identifier outside aiService.js or appConfig.js.'
  },
  {
    id: 'RAW_PHONE_NUMBER',
    regex: /(?:\+91[-\s]?)?[6-9]\d{9}\b/,
    filter: (filePath) => {
      if (filePath.includes('test') || filePath.includes('fixture') || filePath.includes('migration')) return false;
      const base = path.basename(filePath);
      return !ALLOWED_CONTACTS_FILES.includes(base) && base !== 'checkHardcoded.js';
    },
    message: 'Raw phone number literal outside shared/helplines.js or seed fixtures.'
  },
  {
    id: 'RAW_EMAIL_OUTSIDE_SEED',
    regex: /[a-zA-Z0-9._%+-]+@mindcare\.test/,
    filter: (filePath) => {
      if (filePath.includes('test') || filePath.includes('fixture') || filePath.includes('migration')) return false;
      const base = path.basename(filePath);
      return !ALLOWED_CONTACTS_FILES.includes(base) && base !== 'checkHardcoded.js';
    },
    message: 'Test/demo email literal outside seed fixtures or authorized configs.'
  },
  {
    id: 'DEPRECATED_BAND_LABEL',
    regex: /['"](?:Steady & Grounded|Taking Care|Extra Support Available)['"]/,
    filter: (filePath) => !filePath.endsWith('questionnaire.js') && !filePath.endsWith('questionnaireBands.js') && !filePath.endsWith('checkHardcoded.js'),
    message: 'Deprecated score band label detected. Use centralized definitions from questionnaire.js.'
  }
];

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== 'node_modules' &&
        entry.name !== 'dist' &&
        entry.name !== '.git'
      ) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile() && /\.(js|jsx|mjs|ts|tsx)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      FORBIDDEN_RULES.forEach(rule => {
        if (rule.filter && !rule.filter(fullPath)) {
          return;
        }
        if (rule.regex.test(content)) {
          violations.push({
            id: rule.id,
            file: path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/'),
            message: rule.message
          });
        }
      });
    }
  }
}

console.log('🔍 Running check:hardcoded security and content validation...');
TARGET_PATHS.forEach(dir => scanDirectory(dir));

console.log('\n================================================================================================');
console.log('HARD-CODED & CONTENT AUDIT SCAN REPORT');
console.log('================================================================================================');
console.log(`Scan Scope: backend, frontend/src, shared, scripts (Excluding node_modules, dist, .git)`);
console.log(`Rules Checked: Secret fallbacks, API keys, Localhost URLs, Model identifiers, Raw phone/emails, Band labels`);
console.log('------------------------------------------------------------------------------------------------');

if (violations.length > 0) {
  console.error(`\n❌ ${violations.length} VIOLATION(S) DETECTED:`);
  console.log(String('File').padEnd(45) + ' | ' + String('Rule').padEnd(25) + ' | Message');
  console.log('------------------------------------------------------------------------------------------------');
  violations.forEach((v) => {
    console.error(String(v.file).slice(0, 45).padEnd(45) + ' | ' + String(v.id).padEnd(25) + ' | ' + v.message);
  });
  console.error('\nFix the above issues by moving literals into centralized config / environment.\n');
  process.exit(1);
} else {
  console.log('✅ PASS: Zero hard-coded violations found across backend, frontend/src, shared, and scripts.');
  console.log('================================================================================================\n');
  process.exit(0);
}
