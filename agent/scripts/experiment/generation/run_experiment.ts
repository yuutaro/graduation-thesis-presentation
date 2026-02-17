import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DbUtils } from '../../../src/utils/db.js';
import { createEmbeddings } from '../../../src/utils/model-factory.js';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { graph } from '../../../src/graph.js';

const EXPERIMENTS_DIR = path.resolve(__dirname, '../../../experiments');
const MIGRATION_FILE = path.resolve(__dirname, '../../../migrations/001_init.sql');

// Parse Arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    count: 10,
    rag: true, // Default on
    model: "gemini-2.0-flash-exp",
    temperature: 0.9,
    note: "",
    mock: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--count') config.count = parseInt(args[++i], 10);
    if (arg === '--rag') config.rag = args[++i] === 'true' || args[i] === 'on';
    if (arg === '--model') config.model = args[++i];
    if (arg === '--temperature') config.temperature = parseFloat(args[++i]);
    if (arg === '--note') config.note = args[++i];
    if (arg === '--mock') config.mock = args[++i] === 'true';
  }
  return config;
}

// Initialize Temp DB
function initTempDb(dbPath: string) {
  const db = new Database(dbPath);
  sqliteVec.load(db);
  const migration = fs.readFileSync(MIGRATION_FILE, 'utf-8');
  db.exec(migration);
  db.close();
}

async function main() {
  const args = parseArgs();
  
  // Safe model name for directory (replace / and : with _)
  const safeModelName = args.model.replace(/[:/]/g, '_');
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}_${safeModelName}_${args.rag ? 'rag_on' : 'rag_off'}`;
  
  const runDir = path.join(EXPERIMENTS_DIR, runId);

  // Create experiment directory
  fs.mkdirSync(runDir, { recursive: true });

  const configFile = path.join(runDir, 'config.json');
  const dataFile = path.join(runDir, 'data.jsonl');
  const tempDbPath = path.join(runDir, 'temp.db');

  // Save config
  const experimentConfig = {
    ...args,
    runId,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(configFile, JSON.stringify(experimentConfig, null, 2));

  console.log(`\n🚀 Starting Experiment: ${runId}`);
  console.log(`   RAG: ${args.rag ? 'ON' : 'OFF'}`);
  console.log(`   Count: ${args.count}`);
  console.log(`   Output: ${runDir}\n`);

  // Initialize Temp DB
  initTempDb(tempDbPath);
  // Set Env for DbUtils to use temp DB
  process.env.AGENT_DB_PATH = tempDbPath;

  const embeddings = createEmbeddings();
  const categories = ["PLASTIC_MODEL", "HANDCRAFT", "GADGET"];
  let generatedCount = 0;
  let attemptCount = 0;
  const maxAttempts = args.count * 3; // 3x attempts allowed

  try {
    // Loop until target count is reached
    while (generatedCount < args.count) {
      if (attemptCount >= maxAttempts) {
        console.error(`\n❌ Max attempts reached (${maxAttempts}). Stopping.`);
        break;
      }
      attemptCount++;

      // Use generatedCount to rotate categories (ensures balanced output)
      const category = categories[generatedCount % categories.length];
      console.log(`\n--- Generation ${generatedCount + 1}/${args.count} (Attempt ${attemptCount}) [${category}] ---`);

      let clusterData = null;

      if (args.mock) {
        // --- MOCK MODE ---
        // 5% failure rate
        if (Math.random() < 0.05) {
          console.log("   [MOCK] 🎲 Simulated Failure (5%)");
          clusterData = null;
        } else {
          console.log("   [MOCK] ✅ Simulated Success");
          clusterData = {
            theme: `Mock Theme ${attemptCount}`,
            category: category,
            structureType: "INDIVIDUAL",
            users: [{ name: "Mock User" }],
            items: [{ name: "Mock Item" }]
          };
        }
        // Small delay to simulate processing
        await new Promise(r => setTimeout(r, 100));
      } else {
        // --- REAL MODE ---
        // 1 task per loop
        const inputs = {
          targetDistribution: { [category]: 1 },
          pendingTasks: [],
          generatedClusters: [] // Always reset state to save memory
        };

        const config = {
          configurable: {
            thread_id: `exp-${runId}-${attemptCount}`, // Use attemptCount for unique thread ID
            experimentMode: true,
            outputFilePath: dataFile, 
            enableVectorSearch: args.rag,
            runId: runId,
            modelName: args.model,
            temperature: args.temperature
          },
          recursionLimit: 50
        };

        try {
          const stream = await graph.stream(inputs, config);
          for await (const chunk of stream) {
            if (chunk.generator && chunk.generator.generatedClusters && chunk.generator.generatedClusters.length > 0) {
              clusterData = chunk.generator.generatedClusters[0];
            }
          }
        } catch (err) {
          console.error("   ⚠️ Graph execution failed:", err);
        }
      }

      if (clusterData) {
        // Post-process: Vectorize & Save
        console.log(`   ✅ Generated: ${clusterData.theme}`);
        
        // Generate Embedding
        const scenarioText = `
          Category: ${clusterData.category}
          Type: ${clusterData.structureType}
          Theme: ${clusterData.theme}
          Users: ${clusterData.users.map((u: any) => u.name).join(", ")}
          Items: ${clusterData.items.map((i: any) => i.name).join(", ")}
        `.trim();
        
        let vector: number[] = [];
        try {
          // In mock mode, generate random vector if embeddings fails or just skip
          if (args.mock) {
             vector = Array(768).fill(0).map(() => Math.random());
          } else {
             vector = await embeddings.embedQuery(scenarioText);
          }
        } catch (e) {
          console.error("   ⚠️ Failed to embed:", e);
        }

        // Save to JSONL
        const record = {
          runId: runId,
          generatedAt: new Date().toISOString(),
          scenario: {
            theme: clusterData.theme,
            category: clusterData.category,
            structureType: clusterData.structureType,
            vector: vector
          },
          cluster: clusterData
        };
        fs.appendFileSync(dataFile, JSON.stringify(record) + "\n");

        // Save to Temp DB for RAG (if valid vector)
        if (vector.length > 0) {
          const metadata = {
            category: clusterData.category,
            structureType: clusterData.structureType,
            userCount: clusterData.users.length,
            itemCount: clusterData.items.length
          };
          DbUtils.insertScenario(clusterData.theme, metadata, vector);
        }
        generatedCount++;
      } else {
        console.warn("   ⚠️ Failed to generate cluster. Retrying...");
      }
    }

    console.log(`\n✅ Experiment Completed.`);
    console.log(`   Total Generated: ${generatedCount}/${args.count}`);
    console.log(`   Total Attempts: ${attemptCount}`);
    console.log(`   Data saved to: ${dataFile}`);

  } catch (error) {
    console.error("\n❌ Experiment Failed:", error);
    process.exitCode = 1;
  } finally {
    // Cleanup Temp DB
    if (fs.existsSync(tempDbPath)) {
      console.log("   Cleaning up temp DB...");
      fs.unlinkSync(tempDbPath);
    }
  }
}

main();

