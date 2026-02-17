import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../agent.db');
const db = new Database(DB_PATH);

// Load sqlite-vec extension
sqliteVec.load(db);

console.log('--- Database Test Start ---');

try {
  // 1. Prepare dummy data
  const testConcept = "Test Scenario: 20s Male, Outdoor hobby";
  const testMetadata = JSON.stringify({ age: 20, gender: "male", hobby: "outdoor" });
  
  // Generate a dummy 768-dim embedding
  const dummyEmbedding = new Float32Array(768).map(() => Math.random());

  // 2. Insert into 'scenarios'
  console.log('Inserting test scenario...');
  const insertScenario = db.prepare('INSERT INTO scenarios (concept, metadata) VALUES (?, ?)');
  const info = insertScenario.run(testConcept, testMetadata);
  const scenarioId = info.lastInsertRowid;
  console.log(`Scenario inserted with ID: ${scenarioId} (Type: ${typeof scenarioId})`);

  // 3. Insert into 'scenarios_vec'
  console.log('Inserting vector embedding...');
  
  // Ensure ID is a generic number if it's a bigint and safe to cast, or pass as is.
  // better-sqlite3 handles BigInt, but let's be explicit for debugging if needed.
  const idToInsert = typeof scenarioId === 'bigint' ? Number(scenarioId) : scenarioId;
  
  // Convert Float32Array to Buffer for BLOB binding
  const embeddingBuffer = Buffer.from(dummyEmbedding.buffer);

  const insertVector = db.prepare('INSERT INTO scenarios_vec(rowid, embedding) VALUES (CAST(? AS INTEGER), ?)');
  insertVector.run(idToInsert, embeddingBuffer);
  console.log('Vector inserted.');

  // 4. Insert into 'artifact_logs'
  console.log('Inserting artifact log...');
  const insertLog = db.prepare('INSERT INTO artifact_logs (scenario_id, temp_id, real_id) VALUES (?, ?, ?)');
  insertLog.run(scenarioId, 'temp_123', 'real_456');
  console.log('Artifact log inserted.');

  // 5. Query Validation
  console.log('\n--- Verifying Data ---');

  // Check Scenario
  const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(scenarioId);
  console.log('Retrieved Scenario:', scenario);

  // Check Log
  const log = db.prepare('SELECT * FROM artifact_logs WHERE scenario_id = ?').get(scenarioId);
  console.log('Retrieved Log:', log);

  // 6. Vector Search Test (KNN)
  console.log('\n--- Testing Vector Search ---');
  // Search for the 5 nearest neighbors to the dummy embedding we just inserted.
  // Ideally, our own row should be the top match with distance 0.
  
  const search = db.prepare(`
    SELECT
      rowid,
      distance
    FROM scenarios_vec
    WHERE embedding MATCH ?
    ORDER BY distance
    LIMIT 5
  `);

  const results = search.all(dummyEmbedding);
  console.log('Vector Search Results (Top 5 matches):');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results.forEach((row: any) => {
    console.log(`- RowID: ${row.rowid}, Distance: ${row.distance}`);
  });
  
  // Verify if we found our inserted row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const found = results.some((r: any) => r.rowid === scenarioId);
  if (found) {
    console.log(`\nSUCCESS: Found inserted scenario ID ${scenarioId} in vector search results.`);
  } else {
    console.error(`\nFAILURE: Could not find scenario ID ${scenarioId} in vector search results.`);
  }

} catch (err) {
  console.error('Test failed:', err);
} finally {
  db.close();
  console.log('\n--- Database Test End ---');
}
