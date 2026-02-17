
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface based on data.jsonl structure
type ExperimentRecord = {
  runId: string;
  generatedAt: string;
  scenario: {
    theme: string;
    category: string;
    structureType: string;
    vector: number[];
  };
  cluster: any;
};

type VocabularyStats = {
  filename: string;
  totalWords: number;
  uniqueWords: number;
  growthHistory: number[]; // Unique word count at each step (1..N)
};

// Use Intl.Segmenter for Japanese tokenization
const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });

function extractWords(text: string): Set<string> {
  const words = new Set<string>();
  const segments = segmenter.segment(text);
  for (const seg of segments) {
    if (seg.isWordLike) {
      words.add(seg.segment.toLowerCase());
    } else if (!seg.isWordLike && /[\p{L}\p{N}]+/u.test(seg.segment)) {
       words.add(seg.segment.toLowerCase());
    }
  }
  return words;
}

function analyzeFile(filePath: string, limit: number): VocabularyStats {
  console.log(`Analyzing: ${path.basename(filePath)} (Limit: ${limit > 0 ? limit : 'All'})`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  let lines = content.split('\n').filter(line => line.trim() !== '');
  
  if (limit > 0 && lines.length > limit) {
      lines = lines.slice(0, limit);
  }
  
  const uniqueWordSet = new Set<string>();
  const growthHistory: number[] = [];

  for (const line of lines) {
    try {
      const record = JSON.parse(line) as ExperimentRecord;
      const text = record.scenario.theme || ""; 
      
      const newWords = extractWords(text);
      for (const word of newWords) {
        uniqueWordSet.add(word);
      }
      
      growthHistory.push(uniqueWordSet.size);
    } catch (e) {
      console.warn(`Skipping invalid line in ${path.basename(filePath)}`);
    }
  }

  return {
    filename: `${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`,
    totalWords: 0, 
    uniqueWords: uniqueWordSet.size,
    growthHistory
  };
}

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
    console.log("Usage: npx tsx analyze_vocabulary.ts <jsonl_file_1> ... [--limit 100]");
    process.exit(1);
  }

  for (const filePath of files) {
    const result = analyzeFile(filePath, limit);
    
    const inputDir = path.dirname(path.resolve(filePath));
    const outputCsvPath = path.join(inputDir, `vocabulary_growth.csv`);
    
    let csvContent = "Step,UniqueWords\n";
    result.growthHistory.forEach((count, index) => {
      csvContent += `${index + 1},${count}\n`;
    });

    fs.writeFileSync(outputCsvPath, csvContent);
    console.log(`✅ Saved report for ${result.filename}`);
    console.log(`   Stats: ${result.uniqueWords} unique words in ${result.growthHistory.length} records`);
    console.log(`   Path:  ${outputCsvPath}\n`);
  }
}

main();
