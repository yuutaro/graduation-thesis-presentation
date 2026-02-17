
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ScenarioRecord = {
  runId: string;
  scenario: {
    vector: number[];
    theme: string;
  };
  cluster: any;
};

type VectorRecord = {
  runId: string;
  vector: number[];
};

type AnalysisResult = {
  filename: string;
  count: number;
  averageSimilarity: number;
  varianceSimilarity: number;
  similarityDistribution: number[]; 
  nearestNeighborAvg: number; 
};

// --- Math Helpers ---

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

// --- Analysis Logic ---

function analyzeFile(filePath: string, limit: number): AnalysisResult {
  console.log(`\nAnalyzing: ${path.basename(filePath)} (Limit: ${limit > 0 ? limit : 'All'})`);
  
  const dirPath = path.dirname(filePath);
  const vectorFilePath = path.join(dirPath, 'vectors.jsonl');
  
  // 1. Load data.jsonl (to get IDs if needed, though vectors.jsonl might be enough if it covers everything. 
  // But we usually want to ensure we are analyzing the valid dataset)
  // Actually, we just need vectors. vectors.jsonl has runId and vector.
  // However, let's load data.jsonl to cross-reference if needed, or just rely on vectors.jsonl.
  // The user wants to re-analyze using the NEW embeddings.
  
  if (!fs.existsSync(vectorFilePath)) {
      console.warn(`⚠️ vectors.jsonl not found in ${dirPath}. Skipping.`);
      return { 
        filename: path.basename(filePath), count: 0, averageSimilarity: 0, varianceSimilarity: 0, similarityDistribution: [], nearestNeighborAvg: 0 
      };
  }

  console.log(`  -> Loading vectors from vectors.jsonl...`);
  const vectorContent = fs.readFileSync(vectorFilePath, 'utf-8');
  let vectorLines = vectorContent.split('\n').filter(line => line.trim() !== '');
  
  if (limit > 0 && vectorLines.length > limit) {
      vectorLines = vectorLines.slice(0, limit);
  }

  const vectors: number[][] = [];
  
  for (const line of vectorLines) {
      try {
          const record = JSON.parse(line) as VectorRecord;
          if (record.vector && record.vector.length > 0) {
              vectors.push(record.vector);
          }
      } catch (e) {
          console.warn(`  Skipping invalid vector line`);
      }
  }

  const count = vectors.length;
  console.log(`  -> Loaded ${count} vectors.`);

  if (count < 2) {
    return { 
      filename: path.basename(filePath), 
      count, 
      averageSimilarity: 0, 
      varianceSimilarity: 0, 
      similarityDistribution: [], 
      nearestNeighborAvg: 0 
    };
  }

  let totalSim = 0;
  let pairCount = 0;
  const similarities: number[] = [];
  const nearestNeighborSims: number[] = [];

  // Pairwise Similarity
  // Optimization: Pre-calculate magnitudes? cosineSimilarity function does it.
  for (let i = 0; i < count; i++) {
    let maxSimForI = -1;
    for (let j = 0; j < count; j++) {
      if (i === j) continue;
      const sim = cosineSimilarity(vectors[i], vectors[j]);
      
      if (i < j) { // Avoid duplicate pairs for average calculation
        totalSim += sim;
        pairCount++;
        similarities.push(sim);
      }
      
      if (sim > maxSimForI) {
        maxSimForI = sim;
      }
    }
    if (maxSimForI !== -1) {
      nearestNeighborSims.push(maxSimForI);
    }
  }

  const averageSim = totalSim / pairCount;
  const nearestNeighborAvg = nearestNeighborSims.reduce((a, b) => a + b, 0) / nearestNeighborSims.length;

  // Variance
  const variance = similarities.reduce((sum, val) => sum + Math.pow(val - averageSim, 2), 0) / pairCount;

  // Histogram (100 buckets: 0.00-0.01, ..., 0.99-1.00)
  const distribution = new Array(100).fill(0);
  similarities.forEach(sim => {
    // Clamp to 0-99 index
    const bucket = Math.min(Math.floor(Math.max(0, sim) * 100), 99);
    distribution[bucket]++;
  });

  return {
    filename: `${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`,
    count,
    averageSimilarity: averageSim,
    varianceSimilarity: variance,
    similarityDistribution: distribution,
    nearestNeighborAvg
  };
}

// --- Main ---

function main() {
  const args = process.argv.slice(2);
  
  let limit = 0;
  const limitIndex = args.indexOf('--limit');
  
  const files = args.filter((arg, index) => {
    if (arg.startsWith('--')) return false;
    if (index > 0 && args[index - 1] === '--limit') return false;
    return true;
  });

  if (limitIndex !== -1 && args[limitIndex + 1]) {
      limit = parseInt(args[limitIndex + 1], 10);
  }

  if (files.length === 0) {
    console.log("Usage: npx tsx analyze_metrics_v2.ts <jsonl_file_1> ... [--limit 100]");
    process.exit(1);
  }

  for (const filePath of files) {
    const result = analyzeFile(filePath, limit);
    
    // Determine output directory based on input file location
    const inputDir = path.dirname(path.resolve(filePath));
    const outputJsonPath = path.join(inputDir, 'similarity_metrics_v2.json');

    // Save detailed JSON
    fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2));
    
    console.log(`✅ Saved metrics to: ${outputJsonPath}`);
    console.log(`   Count: ${result.count}`);
    console.log(`   Avg Sim: ${result.averageSimilarity.toFixed(4)}`);
    console.log(`   NN Avg:  ${result.nearestNeighborAvg.toFixed(4)}`);
  }
}

main();
