import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB file will be at agent/agent.db
const DB_PATH = path.join(__dirname, '../agent.db');
const MIGRATION_FILE = path.join(__dirname, '../migrations/001_init.sql');

console.log(`Database path: ${DB_PATH}`);
console.log(`Migration file: ${MIGRATION_FILE}`);

const db = new Database(DB_PATH);

// Load sqlite-vec extension
sqliteVec.load(db);

const migrationSql = fs.readFileSync(MIGRATION_FILE, 'utf-8');

try {
  console.log('Running migration...');
  // better-sqlite3 .exec() executes a script containing multiple statements
  db.exec(migrationSql);
  
  console.log('Migration completed successfully.');
  
  // Verify vector table creation
  try {
      const row = db.prepare('select vec_version() as v').get() as { v: string };
      console.log('sqlite-vec version:', row.v);
  } catch (e) {
      console.log('Could not verify vec_version:', e);
  }

} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  db.close();
}
