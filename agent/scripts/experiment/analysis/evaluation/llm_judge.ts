
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { z } from "zod";
import { createChatModel, AVAILABLE_MODELS } from '../../../../src/utils/model-factory.js';
import dotenv from 'dotenv';
import pLimit from 'p-limit'; // For concurrency control

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from agent root (../../../../.env)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// --- Configuration ---
const DEFAULT_SAMPLE_SIZE = 20; // Default samples per file
const CONCURRENCY_LIMIT = 5; // Max concurrent LLM calls
const EVAL_MODEL = AVAILABLE_MODELS.GEMINI_3_PRO; // Judge Model

// --- Schemas ---

const EvaluationSchema = z.object({
  coherence: z.number().min(1).max(5).describe("整合性: 設定と生成物に矛盾がないか (1:矛盾だらけ - 5:完全に整合)"),
  specificity: z.number().min(1).max(5).describe("具体性: 固有名詞や具体的な技法・素材・背景描写が含まれているか (1:抽象的・一般的 - 5:非常に具体的・マニアック)"),
  humanLikeness: z.number().min(1).max(5).describe("人間らしさ: 感情、熱量、生活感、あるいは「手癖」ではない自然な不規則性があるか (1:機械的 - 5:人間味がある)"),
  reason: z.string().describe("評価の理由（短く）"),
});

type EvaluationResult = z.infer<typeof EvaluationSchema> & {
  theme: string;
};

type FileEvaluationSummary = {
  filename: string;
  modelName: string; // Extracted from filename or config
  rag: boolean;      // Extracted from filename or config
  sampleSize: number;
  coherence: number;
  specificity: number;
  humanLikeness: number;
  details: EvaluationResult[];
};

// --- Logic ---

// Helper to extract metadata from filename
// Expected format: <timestamp>_<model>_<rag_on|rag_off>/data.jsonl OR <model>_<rag>...jsonl
function extractMetadata(filePath: string) {
  const dirPath = path.dirname(filePath);
  const dirName = path.basename(dirPath);
  
  let rag = false;
  let modelName = "unknown";

  // 1. Try reading config.json in the same directory
  const configPath = path.join(dirPath, 'config.json');
  if (fs.existsSync(configPath)) {
      try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (config.rag !== undefined) rag = !!config.rag;
          if (config.model) modelName = config.model;
          
          // Map long model names to short display names
          if (modelName === AVAILABLE_MODELS.GEMINI_3_FLASH) modelName = "Gemini 3 Flash";
          else if (modelName === AVAILABLE_MODELS.GEMINI_3_PRO) modelName = "Gemini 3 Pro";
          else if (modelName === AVAILABLE_MODELS.GEMINI_2_FLASH) modelName = "Gemini 2.0 Flash";
          else if (modelName === AVAILABLE_MODELS.GPT_5_2) modelName = "GPT-5.2";
          else if (modelName === AVAILABLE_MODELS.GPT_5_MINI) modelName = "GPT-5 Mini";
          else if (modelName === AVAILABLE_MODELS.GPT_4O) modelName = "GPT-4o"; // If 4o is added later
          
          return { rag, modelName };
      } catch (e) {
          console.warn(`Failed to parse config.json at ${configPath}, falling back to filename.`);
      }
  }

  // 2. Fallback to filename heuristics
  if (dirName.includes('rag_on') || filePath.includes('rag_on')) rag = true;
  
  // Simple heuristic for model name, can be refined based on naming convention
  if (dirName.includes('gemini')) modelName = "Gemini";
  if (dirName.includes('gpt')) modelName = "GPT";
  
  // Try to find specific model identifiers
  if (dirName.includes('flash')) modelName = "Gemini Flash";
  if (dirName.includes('pro')) modelName = "Gemini Pro";
  if (dirName.includes('4o')) modelName = "GPT-4o";
  
  return { rag, modelName };
}

async function evaluateFile(filePath: string, sampleSize: number): Promise<FileEvaluationSummary> {
  const { rag, modelName } = extractMetadata(filePath);
  console.log(`\nEvaluating: ${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`);
  console.log(`  -> Model: ${modelName}, RAG: ${rag ? 'ON' : 'OFF'}`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  let lines = content.split('\n').filter(line => line.trim() !== '');
  
  if (sampleSize > 0 && lines.length > sampleSize) {
      lines = lines.slice(0, sampleSize);
  }
  
  const samples = lines
    .map(line => {
        try { return JSON.parse(line); } catch { return null; }
    })
    .filter(x => x !== null);

  console.log(`  -> Sampled ${samples.length} scenarios.`);

  const model = createChatModel(EVAL_MODEL, 0); 
  const structuredJudge = model.withStructuredOutput(EvaluationSchema);
  const limit = pLimit(CONCURRENCY_LIMIT);

  const promises = samples.map((sample, index) => {
    return limit(async () => {
        const prompt = `
        あなたはクリエイティブなシナリオデータの品質を評価する厳格な審査員です。
        以下の「シナリオ設定」と、それに基づいて生成された「詳細データ」を読み、品質を評価してください。
    
        ## シナリオ設定 (Concept)
        - テーマ: ${sample.scenario.theme}
        - カテゴリ: ${sample.scenario.category}
    
        ## 生成された詳細データ (Cluster)
        - ユーザー数: ${sample.cluster.users.length}
        - プロジェクト数: ${sample.cluster.projects.length}
        - アイテム数: ${sample.cluster.items.length}
        
        ### 代表的なアイテム (Description)
        ${sample.cluster.items.slice(0, 3).map((item: any) => `- ${item.name}: ${item.description}`).join('\n')}
    
        ### 代表的なユーザー (Bio)
        ${sample.cluster.users.slice(0, 2).map((user: any) => `- ${user.name}: ${user.bio}`).join('\n')}
    
        ## 評価基準 (1-5点)
        1. **整合性 (Coherence)**: テーマと生成物の間に矛盾はないか？設定が破綻していないか？
        2. **具体性 (Specificity)**: 
           - 悪い(1-2): 「美しい」「すごい」「様々な」などの抽象的な形容詞ばかり。
           - 良い(4-5): 具体的な素材名（例：真鍮、レジン）、技法（例：金継ぎ、3Dプリント）、固有名詞、数値が含まれている。
        3. **人間らしさ (Human-likeness)**: 
           - 悪い(1-2): 教科書的で無機質。AI特有の「整いすぎた」文章。
           - 良い(4-5): 執着や偏愛、生活感、あるいは文体における自然な揺らぎがある。
        `;

        try {
            const result = await structuredJudge.invoke([
                { role: "user", content: prompt }
            ]);
            process.stdout.write('.'); // Progress dot
            return { ...result, theme: sample.scenario.theme };
        } catch (err) {
            process.stdout.write('x');
            return null;
        }
    });
  });

  const resultsRaw = await Promise.all(promises);
  const results = resultsRaw.filter(r => r !== null) as EvaluationResult[];
  
  console.log("\n  -> Completed.");

  if (results.length === 0) {
      return {
          filename: filePath, modelName, rag, sampleSize: 0,
          coherence: 0, specificity: 0, humanLikeness: 0, details: []
      };
  }

  // Calculate Averages
  const avg = (key: keyof typeof EvaluationSchema) => 
    results.reduce((sum, r) => sum + (r[key] as number), 0) / results.length;

  return {
    filename: filePath,
    modelName,
    rag,
    sampleSize: results.length,
    coherence: avg("coherence"),
    specificity: avg("specificity"),
    humanLikeness: avg("humanLikeness"),
    details: results
  };
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  
  let limit = DEFAULT_SAMPLE_SIZE;
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
    console.log("Usage: npx tsx llm_judge.ts <jsonl_file_1> <jsonl_file_2> ... [--limit 50]");
    process.exit(1);
  }

  const summaries: FileEvaluationSummary[] = [];

  for (const file of files) {
    const result = await evaluateFile(file, limit);
    summaries.push(result);
  }
  
  const scriptDir = __dirname;
  const reportPath = path.join(scriptDir, 'judge_results.json');

  fs.writeFileSync(reportPath, JSON.stringify(summaries, null, 2));
  console.log(`\n✅ Evaluation complete.`);
  console.log(`📄 Results saved to: ${reportPath}`);
  
  // Console Summary Table
  console.log("\n=== Evaluation Summary ===");
  console.log("Model | RAG | Coherence | Specificity | Human-likeness");
  console.log("------|-----|-----------|-------------|---------------");
  summaries.forEach(s => {
    console.log(`${s.modelName.padEnd(10)} | ${s.rag ? 'ON ' : 'OFF'} | ${s.coherence.toFixed(2)}      | ${s.specificity.toFixed(2)}        | ${s.humanLikeness.toFixed(2)}`);
  });
}

main();
