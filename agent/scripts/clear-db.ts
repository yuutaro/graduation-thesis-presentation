import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../agent.db');

const db = new Database(DB_PATH);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  WARNING: This will DELETE ALL DATA in agent.db. Are you sure? (y/N) ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    try {
      console.log('Clearing database...');
      
      db.exec('DELETE FROM artifact_logs');
      db.exec('DELETE FROM scenarios');
      // Virtual table deletion
      db.exec('DELETE FROM scenarios_vec');
      
      // Reset auto-increment counters
      db.exec("DELETE FROM sqlite_sequence WHERE name IN ('scenarios', 'artifact_logs')");

      console.log('✅ Database cleared successfully.');
    } catch (err) {
      console.error('❌ Error clearing database:', err);
    }
  } else {
    console.log('Cancelled.');
  }
  
  db.close();
  rl.close();
});
