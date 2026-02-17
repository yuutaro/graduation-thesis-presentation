
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths relative to this script file
// Script: agent/scripts/experiment/analysis/metrics2/re-embed-scenarios-all.ts
// Target: agent/experiments/
const EXPERIMENTS_BASE_DIR = path.resolve(__dirname, '../../../../experiments');

// Also fix env loading
const envPath = path.resolve(__dirname, '../../../../.env'); // agent/.env

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Try fallback
  dotenv.config(); 
}

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("❌ GOOGLE_API_KEY is missing in .env");
  process.exit(1);
}

const MODEL_NAME = "models/gemini-embedding-001";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/${MODEL_NAME}:batchEmbedContents?key=${API_KEY}`;

// Hardcoded Experiment Directories
const TARGET_DIRS = [
    "2026-01-29T08-30-40-796Z_gemini-3-pro-preview_rag_off",
    "2026-01-29T08-30-40-799Z_gemini-3-flash-preview_rag_off",
    "2026-01-29T08-30-40-800Z_gemini-3-pro-preview_rag_on",
    "2026-01-29T08-30-40-815Z_gemini-3-flash-preview_rag_on",
    "2026-01-31T11-47-56-129Z_gpt-5-mini-2025-08-07_rag_off",
    "2026-01-31T11-47-56-129Z_gpt-5-mini-2025-08-07_rag_on",
    "2026-01-31T11-47-56-129Z_gpt-5.2-2025-12-11_rag_off",
    "2026-01-31T11-47-56-129Z_gpt-5.2-2025-12-11_rag_on"
];

// --- Type Definitions ---
interface ClusterUser {
  name: string;
  bio: string;
  role: string;
}

interface ClusterProject {
  name: string;
  description: string;
}

interface ClusterItem {
  name: string;
  description: string;
}

interface ClusterData {
  theme: string;
  category: string;
  structureType: string;
  users: ClusterUser[];
  projects: ClusterProject[];
  items: ClusterItem[];
}

interface ScenarioRecord {
  runId: string;
  scenario: {
    theme: string;
    category: string;
    structureType: string;
  };
  cluster: ClusterData;
}

interface VectorRecord {
  runId: string;
  vector: number[];
}

// --- Functions ---

async function batchEmbed(texts: string[]): Promise<number[][]> {
  const requests = texts.map(text => ({
    model: MODEL_NAME,
    content: { parts: [{ text }] }
  }));

  const payload = { requests };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { embeddings: { values: number[] }[] };
    return data.embeddings.map(e => e.values);
  } catch (error) {
    console.error("Embedding API Failed:", error);
    throw error;
  }
}

async function processFile(dirName: string, isTest: boolean) {
  const dirPath = path.join(EXPERIMENTS_BASE_DIR, dirName);
  const dataPath = path.join(dirPath, 'data.jsonl');
  
  if (!fs.existsSync(dataPath)) {
    console.warn(`Skipping (No data.jsonl): ${dirPath}`);
    return;
  }

  console.log(`\nProcessing: ${dirName}`);
  
  const content = fs.readFileSync(dataPath, 'utf-8');
  let lines = content.split('\n').filter(line => line.trim() !== '');

  if (isTest) {
      console.log("🧪 Test Mode: Processing first 5 lines only.");
      lines = lines.slice(0, 5);
  }

  const vectors: VectorRecord[] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < lines.length; i += BATCH_SIZE) {
    const batchLines = lines.slice(i, i + BATCH_SIZE);
    const batchTexts: string[] = [];
    const batchRunIds: string[] = [];

    for (const line of batchLines) {
      try {
        const record = JSON.parse(line) as ScenarioRecord;
        const cluster = record.cluster;
        
        // Construct detailed text
        const theme = cluster?.theme || record.scenario.theme;
        const category = cluster?.category || record.scenario.category;
        const type = cluster?.structureType || record.scenario.structureType;

        let text = `Theme: ${theme}\nCategory: ${category}\nType: ${type}\n\n`;

        if (cluster) {
          if (cluster.users && cluster.users.length > 0) {
            text += `# Users\n${cluster.users.map(u => `- ${u.name}: ${u.bio}`).join('\n')}\n\n`;
          }
          if (cluster.projects && cluster.projects.length > 0) {
            text += `# Projects\n${cluster.projects.map(p => `- ${p.name}:\n${p.description}`).join('\n')}\n\n`;
          }
          if (cluster.items && cluster.items.length > 0) {
            text += `# Items\n${cluster.items.map(it => `- ${it.name}:\n${it.description}`).join('\n')}`;
          }
        }

        batchTexts.push(text);
        batchRunIds.push(record.runId);

      } catch (e) {
        console.warn("Skipping invalid JSON line");
      }
    }

    if (batchTexts.length > 0) {
      process.stdout.write(`  Batch ${i / BATCH_SIZE + 1}/${Math.ceil(lines.length / BATCH_SIZE)}... `);
      
      let retries = 0;
      const MAX_RETRIES = 10; // Increased retries for safety
      let success = false;

      while (!success && retries < MAX_RETRIES) {
        try {
          const embeddings = await batchEmbed(batchTexts);
          
          for (let j = 0; j < embeddings.length; j++) {
            vectors.push({
              runId: batchRunIds[j],
              vector: embeddings[j]
            });
          }
          console.log(`OK (${embeddings.length} vectors)`);
          success = true;
          
          // Rate limit mitigation (success case)
          await new Promise(r => setTimeout(r, 1000)); 

        } catch (e: any) {
          retries++;
          const isRateLimit = e.message && e.message.includes('429');
          // Exponential backoff
          const waitTime = 2000 * Math.pow(2, retries); // 4, 8, 16, 32, 64...
          
          if (isRateLimit) {
             console.log(`\n    ⚠️ Rate limit (429). Retrying in ${waitTime/1000}s... (${retries}/${MAX_RETRIES})`);
          } else {
             console.log(`\n    ⚠️ API Error. Retrying in ${waitTime/1000}s... (${retries}/${MAX_RETRIES})`);
          }
          
          await new Promise(r => setTimeout(r, waitTime));
        }
      }

      if (!success) {
        console.error(`  ❌ Failed batch after ${MAX_RETRIES} retries. Skipping.`);
      }
    }
  }

  // Save to vectors.jsonl (Overwrite)
  const outputPath = path.join(dirPath, 'vectors.jsonl');
  const outputContent = vectors.map(v => JSON.stringify(v)).join('\n');
  fs.writeFileSync(outputPath, outputContent);
  console.log(`✅ Saved ${vectors.length} vectors to ${outputPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');

  console.log("🚀 Starting Bulk Re-Embedding for 8 Experiments...");
  if (isTest) console.log("🧪 Running in TEST mode (5 records each)");
  
  for (const dirName of TARGET_DIRS) {
    await processFile(dirName, isTest);
  }
  
  console.log("\n✨ All Done!");
}

main();
