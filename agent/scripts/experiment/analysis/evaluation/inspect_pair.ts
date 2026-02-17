
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLES_DIR = path.resolve(__dirname, 'samples');

type SampleRecord = {
  modelName: string;
  range: string;
  similarity: number;
  pair: [any, any];
};

function main() {
  const args = process.argv.slice(2);
  const fileIndex = parseInt(args[0], 10) || 0;
  const pairIndex = parseInt(args[1], 10) || 0;

  if (args.length < 2) {
    console.log("Usage: npx tsx inspect_pair.ts <file_index> <pair_index>");
    console.log("\nAvailable Files:");
    if (fs.existsSync(SAMPLES_DIR)) {
      const files = fs.readdirSync(SAMPLES_DIR).filter(f => f.endsWith('.jsonl'));
      files.forEach((f, i) => console.log(`  ${i}: ${f}`));
    }
    return;
  }

  const files = fs.readdirSync(SAMPLES_DIR).filter(f => f.endsWith('.jsonl'));
  if (fileIndex < 0 || fileIndex >= files.length) {
    console.error(`Invalid file index. Max: ${files.length - 1}`);
    return;
  }

  const filePath = path.join(SAMPLES_DIR, files[fileIndex]);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const records = lines.map(line => JSON.parse(line)) as SampleRecord[];

  if (pairIndex < 0 || pairIndex >= records.length) {
    console.error(`Invalid pair index. Max: ${records.length - 1}`);
    return;
  }

  const sample = records[pairIndex];
  
  console.log(`\n========================================`);
  console.log(`MODEL: ${sample.modelName}`);
  console.log(`RANGE: ${sample.range}`);
  console.log(`SIMILARITY: ${sample.similarity.toFixed(4)}`);
  console.log(`========================================\n`);

  sample.pair.forEach((cluster, idx) => {
    console.log(`--- Cluster ${idx + 1} ---`);
    console.log(`Category: ${cluster.category}`);
    console.log(`Type:     ${cluster.structureType}`);
    console.log(`Theme:    ${cluster.theme}`);
    console.log(`Project:  ${cluster.project?.description || 'N/A'}`);
    console.log(`Users:`);
    cluster.users?.forEach((u: any) => {
      console.log(`  - ${u.name}: ${u.bio}`);
    });
    console.log(`Items:`);
    cluster.items?.forEach((i: any) => {
      console.log(`  - ${i.name}: ${i.description}`);
    });
    console.log(`\n`);
  });
}

main();
