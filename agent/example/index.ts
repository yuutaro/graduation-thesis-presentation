import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, MessagesAnnotation, START, END, Annotation, interrupt } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { z } from "zod"; // ★追加: 構造定義用

// --- 1. Stateの定義 ---
const GraphState = Annotation.Root({
  ...MessagesAnnotation.spec,
  
  // 最新の下書き (純粋な説明文のみ)
  draft: Annotation<string>({
    reducer: (x, y) => y, 
    default: () => "",
  }),

  // 1つ前の下書き (Diff比較用)
  previous_draft: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "",
  }),
  
  lastAction: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "none",
  }),
});

// --- 2. モデル ---
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0.7,
});

// ★追加: 出力の構造定義
const draftSchema = z.object({
  reply: z.string().describe("ユーザーへの返答、挨拶、または修正箇所の簡単な説明。"),
  draft_content: z.string().describe("商品の紹介文本文のみ。挨拶やマークダウンの装飾線、メタコメントは一切含めないこと。")
});

// --- 3. ノードの定義 ---

// ノードA: 下書き生成 (Drafter)
async function draftNode(state: typeof GraphState.State) {
  const currentDraft = state.draft;
  
  // LLMへの入力メッセージ構築
  const messagesForLLM = [...state.messages];
  
  // 修正ループの場合: 直前の下書きを文脈として注入する
  if (currentDraft) {
    messagesForLLM.push(
      new HumanMessage(
        `【現在の下書き】\n${currentDraft}\n\n` +
        `上記の【現在の下書き】を、履歴にある最新のユーザー指示に従って修正してください。`
      )
    );
  }

  const systemPrompt = new SystemMessage(
    "あなたはC2Cプラットフォームの出品アシスタントです。魅力的な商品紹介文を作成してください。" +
    "出力は必ず指定されたJSONフォーマットに従い、会話部分と説明文データを分離してください。"
  );
  
  // ★構造化出力を強制する
  const structuredModel = model.withStructuredOutput(draftSchema);
  
  // 実行 (戻り値はオブジェクトになる)
  const result = await structuredModel.invoke([systemPrompt, ...messagesForLLM]);

  return { 
    // 会話履歴には、AIの「承知しました！」という返事だけを残す
    messages: [new AIMessage(result.reply)],
    
    // ★ここが重要: 新しい下書きはきれいなデータのみ
    draft: result.draft_content,
    
    // 更新前の下書きを退避させておく (Diff用)
    previous_draft: currentDraft 
  };
}

// ノードB: 人間によるレビュー (Reviewer)
async function reviewNode(state: typeof GraphState.State) {
  
  // 人間に渡すデータ (StudioやフロントエンドでDiff表示に使用)
  const humanInput = interrupt({
    message: "下書きを確認してください。",
    reply_message: state.messages[state.messages.length - 1].content, // AIの挨拶
    current_draft: state.draft,           // 新 (きれいなテキスト)
    previous_draft: state.previous_draft, // 旧 (きれいなテキスト)
    options: ["accept", "regen", "reject"]
  }) as { action: string; feedback?: string };

  const action = humanInput.action;
  const feedback = humanInput.feedback || "";

  if (action === "regen") {
    return {
      lastAction: action,
      messages: [new HumanMessage(`修正指示: ${feedback}`)]
    };
  }

  return {
    lastAction: action
  };
}

// ノードC: 公開 (Publisher)
async function publisherNode(state: typeof GraphState.State) {
  console.log("🚀 DB保存実行 (Clean Data):", state.draft);
  return { messages: [new AIMessage("出品完了")] };
}

// --- 4. 分岐 (Router) ---
function routeReview(state: typeof GraphState.State) {
  const action = state.lastAction;
  if (action === "accept") return "publisher";
  if (action === "regen") return "drafter";
  return END;
}

// --- 5. グラフ構築 ---
const checkpointer = new MemorySaver();

export const agent = new StateGraph(GraphState)
  .addNode("drafter", draftNode)
  .addNode("reviewer", reviewNode)
  .addNode("publisher", publisherNode)

  .addEdge(START, "drafter")
  .addEdge("drafter", "reviewer")
  .addConditionalEdges("reviewer", routeReview, ["publisher", "drafter", END])
  .addEdge("publisher", END)

  .compile({
    checkpointer: checkpointer,
  });