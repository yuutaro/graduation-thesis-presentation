import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Embeddings } from "@langchain/core/embeddings";

export const AVAILABLE_MODELS = {
  // Google Models
  GEMINI_3_FLASH: "gemini-3-flash-preview",
  GEMINI_3_PRO: "gemini-3-pro-preview",
  GEMINI_2_FLASH: "gemini-2.0-flash-exp",
  
  // OpenAI Models
  GPT_5_2: "gpt-5.2-2025-12-11",
  GPT_5_MINI: "gpt-5-mini-2025-08-07",

  // AWS Bedrock Models
  BEDROCK_CLAUDE_3_HAIKU: "anthropic.claude-3-haiku-20240307-v1:0",
  BEDROCK_CLAUDE_3_5_SONNET_V2: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  BEDROCK_CLAUDE_3_5_HAIKU: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
  BEDROCK_LLAMA3_70B: "meta.llama3-70b-instruct-v1:0",
  BEDROCK_LLAMA3_8B: "meta.llama3-8b-instruct-v1:0",
  BEDROCK_MISTRAL_7B: "mistral.mistral-7b-instruct-v0:2",
  
  // Default
  DEFAULT: "gemini-2.0-flash-exp"
};

/**
 * Creates a Chat Model instance based on the model name.
 * Supports Google Gemini, OpenAI GPT, and AWS Bedrock models.
 */
export function createChatModel(modelName: string = AVAILABLE_MODELS.DEFAULT, temperature: number = 0.7): BaseChatModel {
  // 1. Google Models
  if (modelName.startsWith("gemini-") || modelName === "embedding-001") {
    if (!process.env.GOOGLE_API_KEY) {
      console.warn("⚠️ GOOGLE_API_KEY is missing. Calls to Gemini models will fail.");
    }
    return new ChatGoogleGenerativeAI({
      model: modelName,
      temperature: temperature,
      maxRetries: 2,
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }

  // 2. OpenAI Models
  if (modelName.startsWith("gpt-") || modelName.startsWith("o1-")) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ OPENAI_API_KEY is missing. Calls to OpenAI models will fail.");
    }

    // Force temperature to 1 for GPT-5 and o1 models as they don't support custom values
    if (modelName.includes("gpt-5") || modelName.startsWith("o1-")) {
      console.warn(`⚠️ Model ${modelName} does not support custom temperature. Overriding temperature to 1.`);
      temperature = 1;
    }

    return new ChatOpenAI({
      modelName: modelName,
      temperature: temperature,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  // 3. AWS Bedrock Models (Default Fallback)
  // Assumes anything else is a Bedrock model ID
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
    console.warn("⚠️ AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) are missing. Calls to AWS Bedrock models will fail.");
  }
  
  return new BedrockChat({
    model: modelName,
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    modelKwargs: {
      temperature: temperature,
    }
  });
}

/**
 * Creates an Embeddings model instance.
 * Currently fixed to Google's embedding-001 as per requirements.
 */
export function createEmbeddings(): Embeddings {
  return new GoogleGenerativeAIEmbeddings({
    model: "embedding-001",
    apiKey: process.env.GOOGLE_API_KEY,
  });
}
