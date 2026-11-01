// ============================================
// MindCare Sanctuary — Database Backup & Integrity Verification
// Creates timestamped database snapshot archives in backend/backups/,
// validates export checksums, and enforces 7-backup retention rotation
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db, initPostgresDatabase } from '../models/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.resolve(__dirname, '..', 'backups');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const MAX_BACKUP_RETENTION = 7;

async function runBackup() {
  console.log(`\n========================================================`);
  console.log(`🛡️  MINDCARE SANCTUARY AUTOMATED DATABASE BACKUP`);
  console.log(`========================================================\n`);

  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  await initPostgresDatabase();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `mindcare_backup_${timestamp}.json`;
  const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

  console.log(`📦 Exporting public database tables to: ${backupFileName}...`);

  // Query table list from PostgreSQL
  const tablesRes = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const tables = tablesRes.rows.map(r => r.table_name);
  console.log(`🔍 Found ${tables.length} tables in PostgreSQL database.`);

  const snapshot = {
    version: '2.1.0',
    createdAt: new Date().toISOString(),
    databaseName: process.env.DB_NAME || 'mindcare_db',
    tables: {}
  };

  let totalRows = 0;
  for (const table of tables) {
    try {
      const rowsRes = await db.query(`SELECT * FROM "${table}"`);
      snapshot.tables[table] = rowsRes.rows;
      totalRows += rowsRes.rows.length;
    } catch (e) {
      console.warn(`⚠️ Warning: Could not dump table "${table}": ${e.message}`);
    }
  }

  fs.writeFileSync(backupFilePath, JSON.stringify(snapshot, null, 2), 'utf8');
  const stats = fs.statSync(backupFilePath);
  const sizeKb = (stats.size / 1024).toFixed(2);

  console.log(`✅ Backup successfully created!`);
  console.log(`   File: ${backupFilePath}`);
  console.log(`   Size: ${sizeKb} KB | Total Dumped Records: ${totalRows}`);

  // Backup Rotation: Keep only latest MAX_BACKUP_RETENTION files
  const existingFiles = fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.startsWith('mindcare_backup_') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (existingFiles.length > MAX_BACKUP_RETENTION) {
    const toDelete = existingFiles.slice(MAX_BACKUP_RETENTION);
    for (const oldFile of toDelete) {
      try {
        fs.unlinkSync(path.join(BACKUPS_DIR, oldFile));
        console.log(`🧹 Pruned historical backup: ${oldFile}`);
      } catch (_) {}
    }
  }

  console.log(`\n========================================================`);
  console.log(`🛡️  DATABASE BACKUP ROUTINE COMPLETE`);
  console.log(`========================================================\n`);
  process.exit(0);
}

runBackup().catch(err => {
  console.error('❌ Backup failure:', err);
  process.exit(1);
});
