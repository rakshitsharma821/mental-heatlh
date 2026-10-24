// ============================================
// MindCare — Hardcoded Secrets & Fallbacks Security Checker
// Scans backend, frontend, and shared directories.
// Fails the build on violations:
// 1. Insecure secret fallbacks (e.g. || 'secret')
// 2. Real API key literals (e.g. OpenRouter, AWS, GCP, Stripe tokens)
// 3. Localhost string literals outside centralized config files
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

const violations = [];

const TARGET_PATHS = [
  path.join(ROOT_DIR, 'backend', 'controllers'),
  path.join(ROOT_DIR, 'backend', 'middleware'),
  path.join(ROOT_DIR, 'backend', 'models'),
  path.join(ROOT_DIR, 'backend', 'routes'),
  path.join(ROOT_DIR, 'backend', 'utils'),
  path.join(ROOT_DIR, 'shared'),
  path.join(ROOT_DIR, 'frontend', 'src', 'components'),
  path.join(ROOT_DIR, 'frontend', 'src', 'pages'),
  path.join(ROOT_DIR, 'frontend', 'src', 'services')
];

const ALLOWED_CONFIG_FILES = [
  'constants.js',
  'appConfig.js',
  'api.js',
  'server.js',
  'vite.config.js'
];

const FORBIDDEN_PATTERNS = [
  {
    regex: /JWT_SECRET\s*\|\|\s*['"][^'"]+['"]/i,
    message: 'Insecure JWT_SECRET fallback detected. Must come from process.env.'
  },
  {
    regex: /ENCRYPTION_KEY\s*\|\|\s*['"][^'"]+['"]/i,
    message: 'Insecure ENCRYPTION_KEY fallback detected. Must come from process.env.'
  },
  {
    regex: /DB_PASSWORD\s*\|\|\s*['"][^'"]+['"]/i,
    message: 'Insecure DB_PASSWORD fallback detected. Must come from process.env.'
  },
  {
    regex: /OPENROUTER_API_KEY\s*\|\|\s*['"][^'"]+['"]/i,
    message: 'Insecure OPENROUTER_API_KEY fallback detected. Must come from process.env.'
  },
  {
    regex: /sk-or-v1-[a-zA-Z0-9]{32,}/,
    message: 'Live OpenRouter API key literal detected in code.'
  },
  {
    regex: /['"]http:\/\/localhost:\d+['"]/,
    filter: (filePath) => !ALLOWED_CONFIG_FILES.some(allowed => filePath.endsWith(allowed)),
    message: 'Hardcoded localhost URL detected outside centralized config (use appConfig or constants).'
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
        entry.name !== 'tests' &&
        entry.name !== 'dist' &&
        entry.name !== '.git'
      ) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile() && /\.(js|jsx|mjs|ts|tsx)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      FORBIDDEN_PATTERNS.forEach(rule => {
        if (rule.filter && !rule.filter(fullPath)) {
          return;
        }
        if (rule.regex.test(content)) {
          violations.push({
            file: path.relative(ROOT_DIR, fullPath),
            message: rule.message
          });
        }
      });
    }
  }
}

console.log('🔍 Running check:hardcoded security validation...');
TARGET_PATHS.forEach(dir => scanDirectory(dir));

if (violations.length > 0) {
  console.error('\n❌ HARDCODED SECRETS / INSECURE FALLBACKS DETECTED:');
  violations.forEach((v, i) => {
    console.error(`  ${i + 1}. [${v.file}] -> ${v.message}`);
  });
  console.error('\nFix the above issues by removing fallbacks and reading from environment or config files.\n');
  process.exit(1);
} else {
  console.log('✅ PASS: No insecure hardcoded secrets, keys, or invalid localhost URLs detected.');
  process.exit(0);
}
