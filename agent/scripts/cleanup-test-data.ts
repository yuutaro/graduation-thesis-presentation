import { McpClient } from '../src/utils/mcp-client.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

async function main() {
  const targetUserPublicIds = ['user_test_004'];

  console.log(`Starting cleanup via MCP for users: ${targetUserPublicIds.join(', ')}`);

  try {
    const result = await McpClient.cleanupTestData(targetUserPublicIds);
    console.log("Cleanup Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Cleanup Failed:", error);
    process.exit(1);
  }
}

main();
