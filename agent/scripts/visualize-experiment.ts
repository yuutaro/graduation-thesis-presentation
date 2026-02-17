import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';

// Types Definitions
interface SimulatedUser {
  tempId: string;
  name: string;
  role: string;
  bio: string;
}

interface SimulatedProject {
  tempId: string;
  name: string;
  ownerId: string;
  description: string;
  mode: string;
  memberIds: string[];
}

interface SimulatedItem {
  tempId: string;
  name: string;
  authorId: string;
  projectId: string | null;
  description: string;
}

interface ScenarioCluster {
  category: string;
  structureType: string;
  theme: string;
  users: SimulatedUser[];
  projects: SimulatedProject[];
  items: SimulatedItem[];
}

interface ExperimentRecord {
  runId: string;
  generatedAt: string;
  scenario: {
    theme: string;
    category: string;
    structureType: string;
  };
  cluster: ScenarioCluster;
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: npx tsx agent/scripts/visualize-experiment.ts <jsonl_file_path> [start_line] [end_line]");
  console.log("Example: npx tsx agent/scripts/visualize-experiment.ts ./data.jsonl 1 10");
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), args[0]);
let startLine = 1;
let endLine = Infinity;

if (args.length === 2) {
  // Case: path + single number -> display only that line
  const targetLine = parseInt(args[1], 10);
  startLine = targetLine;
  endLine = targetLine;
} else if (args.length >= 3) {
  // Case: path + start + end -> display range
  const arg1 = parseInt(args[1], 10);
  const arg2 = parseInt(args[2], 10);
  
  // Handle start > end by swapping
  startLine = Math.min(arg1, arg2);
  endLine = Math.max(arg1, arg2);
}

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

async function processFile() {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let currentLine = 0;
  let processedCount = 0;

  console.log(`\nReading file: ${filePath}`);
  console.log(`Target range: Line ${startLine} to ${endLine === Infinity ? 'End' : endLine}\n`);

  for await (const line of rl) {
    currentLine++;

    if (currentLine < startLine) continue;
    if (currentLine > endLine) break;

    try {
      if (!line.trim()) continue;
      
      const record = JSON.parse(line) as ExperimentRecord;
      const cluster = record.cluster;
      
      if (!cluster) {
        console.warn(`[Line ${currentLine}] No cluster data found.`);
        continue;
      }

      processedCount++;
      displayCluster(cluster, currentLine, record.generatedAt);

    } catch (e) {
      console.error(`[Line ${currentLine}] Failed to parse JSON: ${(e as Error).message}`);
    }
  }

  if (processedCount === 0) {
    console.log("No records found in the specified range.");
  }
}

function displayCluster(cluster: ScenarioCluster, lineNum: number, generatedAt: string) {
  // ID Mapping for resolution
  const userMap = new Map<string, string>();
  cluster.users.forEach(u => userMap.set(u.tempId, u.name));

  const projectMap = new Map<string, string>();
  cluster.projects.forEach(p => projectMap.set(p.tempId, p.name));

  const hr = "=".repeat(80);
  const subHr = "-".repeat(40);

  console.log(hr);
  console.log(`RECORD #${lineNum} | Date: ${generatedAt}`);
  console.log(`THEME: ${cluster.theme}`);
  console.log(`Category: ${cluster.category} | Type: ${cluster.structureType}`);
  console.log(hr);

  // --- USERS ---
  console.log(`\n[ USERS (${cluster.users.length}) ]`);
  cluster.users.forEach(user => {
    console.log(subHr);
    console.log(`  * ${user.name} (${user.role})`);
    console.log(`    Bio: ${truncate(user.bio, 120)}`);
    console.log(subHr);
  });

  // --- PROJECTS ---
  console.log(`\n[ PROJECTS (${cluster.projects.length}) ]`);
  if (cluster.projects.length === 0) console.log("  (None)");
  cluster.projects.forEach(proj => {
    const ownerName = userMap.get(proj.ownerId) || proj.ownerId;
    const memberNames = proj.memberIds.map(mid => userMap.get(mid) || mid).join(", ");
    
    console.log(subHr);
    console.log(`  * ${proj.name} (Mode: ${proj.mode})`);
    console.log(`    Owner: ${ownerName}`);
    console.log(`    Members: ${memberNames}`);
    console.log(`    Description: ${truncate(proj.description, 100)}`);
    console.log(subHr);
  });

  // --- ITEMS ---
  console.log(`\n[ ITEMS (${cluster.items.length}) ]`);
  if (cluster.items.length === 0) console.log("  (None)");
  cluster.items.forEach(item => {
    const authorName = userMap.get(item.authorId) || item.authorId;
    const projectName = item.projectId ? (projectMap.get(item.projectId) || item.projectId) : "(Solo Work)";
    
    console.log(subHr);
    console.log(`  * ${item.name}`);
    console.log(`    Author: ${authorName}`);
    console.log(`    Project: ${projectName}`);
    console.log(`    Description: ${truncate(item.description, 100)}`);
    console.log(subHr);
  });
  
  console.log("\n");
}

function truncate(str: string, max: number): string {
  if (!str) return "";
  // Return the full string, just normalizing newlines slightly for readability in lists if needed,
  // or keeping it exactly as is. Let's keep newlines but maybe indent them if we wanted perfect formatting.
  // For now, just returning the string without truncation as requested.
  return str;
}

processFile();
