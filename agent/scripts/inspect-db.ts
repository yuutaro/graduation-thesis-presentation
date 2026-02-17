import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import * as sqliteVec from 'sqlite-vec';
import { DbUtils } from '../src/utils/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../agent.db');

const db = new Database(DB_PATH);
sqliteVec.load(db);

const args = process.argv.slice(2);
const command = args[0]; // search, detail, or list (default)

async function main() {
  if (command === '--search' || command === '-s') {
    const query = args[1];
    if (!query) {
      console.error('Please provide a search query.');
      process.exit(1);
    }
    await searchScenarios(query);
  } else if (command === '--id' || command === '-i') {
    const id = args[1];
    if (!id) {
      console.error('Please provide a scenario ID.');
      process.exit(1);
    }
    showDetail(Number(id));
  } else {
    listScenarios();
  }
}

function listScenarios() {
  console.log('\n=== Recent Scenarios ===');
  const rows = db.prepare(`
    SELECT id, concept, metadata, created_at 
    FROM scenarios 
    ORDER BY id DESC 
    LIMIT 20
  `).all();

  if (rows.length === 0) {
    console.log('No data found.');
    return;
  }

  const tableData = rows.map((row: any) => {
    const meta = JSON.parse(row.metadata);
    return {
      ID: row.id,
      Category: meta.category,
      Type: meta.structureType,
      'Concept (Truncated)': row.concept.length > 50 ? row.concept.substring(0, 50) + '...' : row.concept,
      Items: meta.itemCount,
      Users: meta.userCount,
      Created: row.created_at
    };
  });

  console.table(tableData);
}

function showDetail(id: number) {
  const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id) as any;
  if (!scenario) {
    console.error(`Scenario ID ${id} not found.`);
    return;
  }

  console.log(`\n=== Scenario Detail [ID: ${id}] ===`);
  console.log(`Concept: ${scenario.concept}`);
  console.log(`Created: ${scenario.created_at}`);
  console.log('Metadata:', JSON.parse(scenario.metadata));

  const logs = db.prepare('SELECT temp_id, real_id FROM artifact_logs WHERE scenario_id = ?').all(id);
  
  if (logs.length > 0) {
    console.log('\n--- Artifact Logs (ID Mapping) ---');
    console.table(logs);
  } else {
    console.log('\n(No artifact logs found)');
  }
}

async function searchScenarios(queryText: string) {
  console.log(`\n=== Vector Search Results for: "${queryText}" ===`);
  
  // Need to import embeddings to generate vector
  // We can reuse the logic from src, but this is a script.
  // We'll rely on the same GoogleGenerativeAIEmbeddings.
  // Note: This requires GOOGLE_API_KEY environment variable.
  
  try {
    const { GoogleGenerativeAIEmbeddings } = await import("@langchain/google-genai");
    
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "embedding-001",
    });
    
    const vector = await embeddings.embedQuery(queryText);
    const results = DbUtils.searchSimilarScenarios(vector, 5);

    if (results.length === 0) {
      console.log('No matches found.');
      return;
    }

    const tableData = results.map(r => ({
      ID: r.id,
      Score: r.distance.toFixed(4), // Lower is better (L2 distance usually in sqlite-vec? Or cosine?)
      // sqlite-vec vec0 usually does L2 squared or cosine depending on config?
      // Wait, DbUtils uses `ORDER BY vec.distance`.
      // Let's just show the value.
      Concept: r.concept
    }));

    console.table(tableData);

  } catch (error) {
    console.error('Search failed:', error);
  }
}

main();
