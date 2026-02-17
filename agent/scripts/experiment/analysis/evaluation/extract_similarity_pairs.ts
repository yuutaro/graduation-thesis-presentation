
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---
const TARGET_FILES = [
  {
    name: "GPT-5.2 (RAG ON)",
    dataPath: path.resolve(__dirname, '../../../../experiments/2026-01-31T11-47-56-129Z_gpt-5.2-2025-12-11_rag_on/data.jsonl'),
    vectorPath: path.resolve(__dirname, '../../../../experiments/2026-01-31T11-47-56-129Z_gpt-5.2-2025-12-11_rag_on/vectors.jsonl')
  },
  {
    name: "Gemini 3 Pro (RAG ON)",
    dataPath: path.resolve(__dirname, '../../../../experiments/2026-01-29T08-30-40-800Z_gemini-3-pro-preview_rag_on/data.jsonl'),
    vectorPath: path.resolve(__dirname, '../../../../experiments/2026-01-29T08-30-40-800Z_gemini-3-pro-preview_rag_on/vectors.jsonl')
  }
];

const OUTPUT_DIR = path.resolve(__dirname, 'samples');
const SAMPLE_COUNT = 10;

const RANGES = {
  HIGH: { min: 0.85, max: 0.95 },
  MID:  { min: 0.75, max: 0.85 },
  LOW:  { min: 0.65, max: 0.75 }
};

// --- Types ---
type ScenarioRecord = {
  runId: string;
  scenario: {
    theme: string;
    category: string;
    structureType: string;
    [key: string]: any;
  };
  cluster: any;
  [key: string]: any;
};

type VectorRecord = {
  runId: string;
  vector: number[];
};

type PairSample = {
  modelName: string;
  range: string;
  similarity: number;
  pair: [any, any]; // The full cluster objects
};

// --- Math Helpers ---
function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function magnitude(a: number[]): number {
  return Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
}

function processFile(fileConfig: { name: string, dataPath: string, vectorPath: string }) {
  console.log(`\nProcessing: ${fileConfig.name}`);
  
  if (!fs.existsSync(fileConfig.dataPath)) {
    console.error(`❌ Data file not found: ${fileConfig.dataPath}`);
    return;
  }
  if (!fs.existsSync(fileConfig.vectorPath)) {
    console.error(`❌ Vector file not found: ${fileConfig.vectorPath}`);
    return;
  }

  // Load Data
  const dataContent = fs.readFileSync(fileConfig.dataPath, 'utf-8');
  const dataLines = dataContent.split('\n').filter(line => line.trim() !== '');
  const dataRecords = dataLines.map(line => JSON.parse(line)) as ScenarioRecord[];
  
  // Load Vectors
  const vectorContent = fs.readFileSync(fileConfig.vectorPath, 'utf-8');
  const vectorLines = vectorContent.split('\n').filter(line => line.trim() !== '');
  const vectorRecords = vectorLines.map(line => JSON.parse(line)) as VectorRecord[];

  if (dataRecords.length !== vectorRecords.length) {
    console.warn(`⚠️ Mismatch: Data count (${dataRecords.length}) vs Vector count (${vectorRecords.length}). Using minimum.`);
  }
  
  const count = Math.min(dataRecords.length, vectorRecords.length);
  console.log(`   Loaded ${count} records with re-calculated vectors.`);

  const samples: { [key: string]: PairSample[] } = {
    HIGH: [],
    MID: [],
    LOW: []
  };

  const vectors = vectorRecords.slice(0, count).map(r => r.vector);
  const magnitudes = vectors.map(v => magnitude(v));

  // Create pairs
  let pairs: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      pairs.push([i, j]);
    }
  }

  // Shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  console.log(`   Scanning ${pairs.length} pairs...`);

  for (const [i, j] of pairs) {
    if (samples.HIGH.length >= SAMPLE_COUNT && 
        samples.MID.length >= SAMPLE_COUNT && 
        samples.LOW.length >= SAMPLE_COUNT) {
      break;
    }

    const vecA = vectors[i];
    const vecB = vectors[j];
    const magA = magnitudes[i];
    const magB = magnitudes[j];

    if (!vecA || !vecB || magA === 0 || magB === 0) continue;

    const sim = dotProduct(vecA, vecB) / (magA * magB);

    let rangeKey = '';
    if (sim >= RANGES.HIGH.min && sim < RANGES.HIGH.max) rangeKey = 'HIGH';
    else if (sim >= RANGES.MID.min && sim < RANGES.MID.max) rangeKey = 'MID';
    else if (sim >= RANGES.LOW.min && sim < RANGES.LOW.max) rangeKey = 'LOW';

    if (rangeKey && samples[rangeKey].length < SAMPLE_COUNT) {
      const cleanCluster1 = { ...dataRecords[i].cluster };
      const cleanCluster2 = { ...dataRecords[j].cluster };
      
      samples[rangeKey].push({
        modelName: fileConfig.name,
        range: rangeKey,
        similarity: sim,
        pair: [cleanCluster1, cleanCluster2]
      });
    }
  }

  console.log(`   Found samples: HIGH=${samples.HIGH.length}, MID=${samples.MID.length}, LOW=${samples.LOW.length}`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const outputFilename = `samples_${fileConfig.name.replace(/[^a-zA-Z0-9]/g, '_')}.jsonl`;
  const outputPath = path.join(OUTPUT_DIR, outputFilename);
  
  const allSamples = [...samples.HIGH, ...samples.MID, ...samples.LOW];
  const stream = fs.createWriteStream(outputPath);
  
  allSamples.forEach(sample => {
    stream.write(JSON.stringify(sample) + '\n');
  });
  stream.end();

  console.log(`✅ Saved to ${outputPath}`);
}

function main() {
  for (const file of TARGET_FILES) {
    processFile(file);
  }
}

main();
