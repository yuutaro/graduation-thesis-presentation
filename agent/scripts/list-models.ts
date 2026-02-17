
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(process.cwd(), 'agent/.env');
dotenv.config({ path: envPath });

async function listModels() {
  const API_KEY = process.env.GOOGLE_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.models) {
      console.log("Available Models:");
      data.models.forEach((m: any) => {
          if (m.name.includes("embed")) {
              console.log(`- ${m.name} (${m.supportedGenerationMethods})`);
          }
      });
  } else {
      console.log("Error:", data);
  }
}

listModels();
