import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { createChatModel } from '../src/utils/model-factory.js';

async function main() {
  console.log("🔍 Bulk Verifying AWS Bedrock Models...");

  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.AWS_REGION;

  if (!awsAccessKey || !awsSecretKey || !awsRegion) {
    console.error("❌ AWS Credentials missing in environment variables.");
    return;
  }
  console.log(`   Region: ${awsRegion}\n`);

  // Read models from temp.txt
  const tempFilePath = path.resolve(process.cwd(), 'temp.txt');
  if (!fs.existsSync(tempFilePath)) {
    console.error(`❌ Model list file not found at: ${tempFilePath}`);
    return;
  }

  const fileContent = fs.readFileSync(tempFilePath, 'utf-8');
  const models = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0 && !line.startsWith('#'));

  console.log(`   Found ${models.length} models to test.\n`);

  const results: { model: string; status: 'OK' | 'FAILED'; message: string }[] = [];

  // Helper to test a single model with timeout
  const testModel = async (modelName: string) => {
    try {
      const model = createChatModel(modelName, 0.7);
      // Timeout after 10 seconds to avoid hanging
      const response = await Promise.race([
        model.invoke("Hello"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]) as any;
      
      return { status: 'OK', message: 'Success' };
    } catch (error: any) {
      let msg = error.message || "Unknown error";
      if (msg.includes("AccessDeniedException")) msg = "Access Denied";
      if (msg.includes("ValidationException")) msg = "Invalid Model ID";
      if (msg.includes("on-demand throughput isn’t supported")) msg = "On-demand not supported";
      if (msg.includes("channel program accounts")) msg = "Channel program restricted";
      
      // Clean up error message length
      // if (msg.length > 100) msg = msg.substring(0, 100) + "...";
      return { status: 'FAILED', message: msg };
    }
  };

  // Run tests sequentially to avoid rate limits
  for (const modelName of models) {
    process.stdout.write(`   Testing ${modelName.padEnd(50)} ... `);
    const result = await testModel(modelName);
    
    if (result.status === 'OK') {
      console.log("✅ OK");
    } else {
      console.log("❌ FAILED");
      console.log(`      └─ ${result.message}`);
    }
    
    results.push({ model: modelName, status: result.status as any, message: result.message });
  }

  // Summary
  console.log("\n\n=== SUMMARY ===");
  const successful = results.filter(r => r.status === 'OK');
  const failed = results.filter(r => r.status === 'FAILED');

  console.log(`\n✅ AVAILABLE MODELS (${successful.length}):`);
  successful.forEach(r => console.log(`   - ${r.model}`));

  console.log(`\n❌ UNAVAILABLE MODELS (${failed.length}):`);
  failed.forEach(r => console.log(`   - ${r.model.padEnd(50)} : ${r.message}`));
}

main();
