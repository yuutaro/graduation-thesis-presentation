import { McpClient } from '../src/utils/mcp-client.js';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const DB_PATH = path.join(__dirname, '../agent.db');

async function main() {
  console.log("\n==================================================");
  console.log("   DELETING ALL GENERATED DATA (Backend & Agent)");
  console.log("==================================================\n");

  if (!fs.existsSync(DB_PATH)) {
    console.log("Agent DB not found. Nothing to delete.");
    return;
  }

  const db = new Database(DB_PATH);

  // 1. Fetch all User IDs from artifact_logs
  // We assume User temp_ids contain 'user' (case insensitive)
  // or based on our knowledge 'temp_user_' prefix.
  // To be safe, let's look for 'user' in temp_id.
  
  try {
    const rows = db.prepare(`
      SELECT temp_id, real_id 
      FROM artifact_logs 
      WHERE temp_id LIKE 'u_%' OR temp_id LIKE '%user%'
    `).all() as { temp_id: string; real_id: string }[];

    if (rows.length === 0) {
      console.log("No user logs found in Agent DB.");
    } else {
      console.log(`Found ${rows.length} user records in Agent DB.`);
      
      const userIds = rows.map(r => parseInt(r.real_id, 10)).filter(id => !isNaN(id));
      
      if (userIds.length > 0) {
        console.log(`Target User IDs: ${userIds.join(', ')}`);
        
        // 2. Call MCP to delete users from Backend
        console.log("-> Calling MCP to delete users from Backend...");
        const result = await McpClient.cleanupTestDataByIds(userIds);
        console.log("MCP Result:", JSON.stringify(result, null, 2));
      }
    }

  } catch (error) {
    console.error("Error reading/processing Agent DB:", error);
  } finally {
    db.close();
  }

  // 3. Clear Agent DB
  console.log("\n-> Clearing Agent DB tables...");
  try {
    const dbToClear = new Database(DB_PATH);
    sqliteVec.load(dbToClear);
    // Clear tables but keep schema
    dbToClear.prepare("DELETE FROM artifact_logs").run();
    dbToClear.prepare("DELETE FROM scenarios_vec").run();
    dbToClear.prepare("DELETE FROM scenarios").run();
    // Reset sequences if needed (sqlite_sequence)
    dbToClear.prepare("DELETE FROM sqlite_sequence WHERE name='scenarios' OR name='artifact_logs'").run();
    
    console.log("Agent DB cleared successfully.");
    dbToClear.close();
  } catch (error) {
    console.error("Error clearing Agent DB:", error);
  }

  console.log("\nAll cleanup tasks completed.");
}

main();
