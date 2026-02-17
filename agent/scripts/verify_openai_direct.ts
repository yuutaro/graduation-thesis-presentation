import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from agent root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  console.log("🔍 Verifying OpenAI API Key...");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY not found in environment variables.");
    console.log("   Checked path:", path.resolve(__dirname, '../.env'));
    return;
  }
  
  console.log(`✅ API Key loaded: ${apiKey.slice(0, 8)}...`);

  const openai = new OpenAI({ apiKey });

  // Test with gpt-3.5-turbo as it's the standard cheap model
  const model = "gpt-3.5-turbo"; 
  console.log(`🚀 Sending request to OpenAI (${model})...`);

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Hello? Just checking connection." }],
      model: model,
    });

    console.log("\n✅ Success! Response:");
    console.log("---------------------------------------------------");
    console.log(completion.choices[0].message.content);
    console.log("---------------------------------------------------");

  } catch (error: any) {
    console.error("\n❌ API Request Failed:");
    if (error instanceof OpenAI.APIError) {
      console.error(`   Status: ${error.status}`); 
      console.error(`   Name: ${error.name}`); 
      console.error(`   Code: ${error.code}`);
      console.error(`   Type: ${error.type}`);
      console.error(`   Message: ${error.message}`);
    } else {
      console.error(error);
    }
  }
}

main();
