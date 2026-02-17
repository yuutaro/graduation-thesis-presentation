import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance: Database.Database | null = null;

export const getDb = (): Database.Database => {
  if (!dbInstance) {
    // DB file is at agent/agent.db (relative to this file in agent/src/utils)
    // Allow overriding via environment variable for experiments
    const dbPath = process.env.AGENT_DB_PATH
      ? path.resolve(process.env.AGENT_DB_PATH)
      : path.join(__dirname, '../../agent.db');

    dbInstance = new Database(dbPath);
    sqliteVec.load(dbInstance);
  }
  return dbInstance;
};


export type ScenarioRow = {
  id: number;
  concept: string;
  metadata: string;
  created_at: string;
};

export type ArtifactLogRow = {
  id: number;
  scenario_id: number;
  temp_id: string;
  real_id: string;
  created_at: string;
};

export const DbUtils = {
  /**
   * Search for similar scenarios using vector search
   */
  searchSimilarScenarios: (embedding: number[], limit: number = 5): { id: number; distance: number; concept: string }[] => {
    const db = getDb();
    
    // Create a Float32Array from the embedding
    const float32Embedding = new Float32Array(embedding);
    const embeddingBuffer = Buffer.from(float32Embedding.buffer);

    const query = `
      SELECT
        vec.rowid as id,
        vec.distance,
        s.concept
      FROM scenarios_vec vec
      JOIN scenarios s ON vec.rowid = s.id
      WHERE vec.embedding MATCH ?
        AND k = ${limit}
      ORDER BY vec.distance
    `;

    return db.prepare(query).all(embeddingBuffer) as { id: number; distance: number; concept: string }[];
  },

  /**
   * Insert a new scenario with its vector embedding
   */
  insertScenario: (concept: string, metadata: any, embedding: number[]): number | bigint => {
    const db = getDb();
    
    const insertScenarioStmt = db.prepare('INSERT INTO scenarios (concept, metadata) VALUES (?, ?)');
    const insertVecStmt = db.prepare('INSERT INTO scenarios_vec(rowid, embedding) VALUES (CAST(? AS INTEGER), ?)');

    const float32Embedding = new Float32Array(embedding);
    const embeddingBuffer = Buffer.from(float32Embedding.buffer);

    const info = insertScenarioStmt.run(concept, JSON.stringify(metadata));
    const scenarioId = info.lastInsertRowid;
    
    // Handle BigInt if necessary (better-sqlite3 returns bigint for lastInsertRowid)
    const idValue = typeof scenarioId === 'bigint' ? Number(scenarioId) : scenarioId;

    insertVecStmt.run(idValue, embeddingBuffer);
    
    return scenarioId;
  },

  /**
   * Log artifact mapping
   */
  insertArtifactLog: (scenarioId: number | bigint, tempId: string, realId: string) => {
    const db = getDb();
    const insertStmt = db.prepare('INSERT INTO artifact_logs (scenario_id, temp_id, real_id) VALUES (?, ?, ?)');
    insertStmt.run(scenarioId, tempId, realId);
  }
};
