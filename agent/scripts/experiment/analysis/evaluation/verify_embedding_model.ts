
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.resolve(__dirname, '../../../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const LOG_FILE_PATH = path.resolve(__dirname, '../../../../experiments/2026-01-29T08-30-40-800Z_gemini-3-pro-preview_rag_on/data.jsonl');
const VECTOR_FILE_PATH = path.resolve(__dirname, '../../../../experiments/2026-01-29T08-30-40-800Z_gemini-3-pro-preview_rag_on/vectors.jsonl');

// --- Helper Functions ---

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function magnitude(a: number[]): number {
  return Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

// ... (constructText function is same) ...

// --- Main ---

async function main() {
  console.log("Reading log files...");
  const dataContent = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
  const dataLines = dataContent.split('\n').filter(line => line.trim() !== '');
  
  const vectorContent = fs.readFileSync(VECTOR_FILE_PATH, 'utf-8');
  const vectorLines = vectorContent.split('\n').filter(line => line.trim() !== '');

  // Find correct records by theme keyword (Gemini High Pair)
  const indexA = dataLines.findIndex(l => JSON.parse(l).scenario.theme.includes("架空メカの内部構造を可視化する"));
  const indexB = dataLines.findIndex(l => JSON.parse(l).scenario.theme.includes("Anatomical Cross-section Modeler"));

  if (indexA === -1 || indexB === -1) {
    console.error("❌ Could not find target records by theme keyword.");
    return;
  }

  const recordA = JSON.parse(dataLines[indexA]);
  const recordB = JSON.parse(dataLines[indexB]);
  
  const vectorRecordA = JSON.parse(vectorLines[indexA]);
  const vectorRecordB = JSON.parse(vectorLines[indexB]);

  console.log(`\nRecord A (Found at ${indexA}): ${recordA.scenario.theme.substring(0, 30)}...`);
  console.log(`Record B (Found at ${indexB}): ${recordB.scenario.theme.substring(0, 30)}...`);

  // 1. Logged Vectors (data.jsonl - Simple Text)
  console.log("\n--- 1. Logged Vectors (data.jsonl / Simple) ---");
  const vecA_Log = recordA.scenario.vector;
  const vecB_Log = recordB.scenario.vector;
  
  if (vecA_Log && vecB_Log) {
    const simLog = cosineSimilarity(vecA_Log, vecB_Log);
    console.log(`Simple Vector Similarity: ${simLog.toFixed(4)}`);
    console.log(`Vector Dimension: ${vecA_Log.length}`);
  }

  // 2. Re-calculated Vectors (vectors.jsonl - Detailed Text)
  console.log("\n--- 2. Re-calculated Vectors (vectors.jsonl / Detailed) ---");
  const vecA_Recalc = vectorRecordA.vector;
  const vecB_Recalc = vectorRecordB.vector;

  if (vecA_Recalc && vecB_Recalc) {
    const simRecalc = cosineSimilarity(vecA_Recalc, vecB_Recalc);
    console.log(`Detailed Vector Similarity: ${simRecalc.toFixed(4)}`);
    console.log(`Vector Dimension: ${vecA_Recalc.length}`);
  }
}

main();

