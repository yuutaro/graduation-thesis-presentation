import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

// --- 1. ツールの定義 ---
const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "Add two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "Divide two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const tools = [add, multiply, divide];

// --- 2. モデルの定義 ---
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0, // 計算などは正確に行わせたいので0にするのが一般的
});

// モデルにツールをバインド（知恵を与える）
const modelWithTools = model.bindTools(tools);

// --- 3. ノード関数の定義 ---

// モデルを呼び出すノード
async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await modelWithTools.invoke(state.messages);
  return { messages: [response] };
}

// ツールを実行するノード（LangGraphの組み込み機能を使用）
const toolNode = new ToolNode(tools);

// --- 4. グラフの構築 ---
export const agent = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  
  .addEdge(START, "agent")
  
  // 条件付きエッジ: モデルが「ツールを使いたい」と言ったら tools へ、そうでなければ END へ
  .addConditionalEdges("agent", toolsCondition, ["tools", END])
  
  // ツール実行後は必ず agent (モデル) に戻って結果を報告
  .addEdge("tools", "agent")
  
  .compile();