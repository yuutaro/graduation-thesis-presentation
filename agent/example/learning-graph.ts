import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { SystemMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";

// ---------------------------------------------------------
// 1. モデルの準備
// ---------------------------------------------------------
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0.7, // 創造性が必要なので少し上げる
});

// ---------------------------------------------------------
// 2. グラフの状態（State）を定義
// これがノード間でリレーされる「バケツ」の中身です
// ---------------------------------------------------------
const GraphState = Annotation.Root({
  // 会話履歴
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y), // 配列を結合していく
    default: () => [],
  }),
  // 生成されたプロフィール案
  profileDraft: Annotation<string>,
  // レビュー結果 (ok / ng)
  feedback: Annotation<string>,
  // ループ回数（無限ループ防止用）
  retryCount: Annotation<number>({
    reducer: (x, y) => y, // 最新の値で上書き
    default: () => 0,
  }),
});

// ---------------------------------------------------------
// 3. ノード（作業担当者）の定義
// ---------------------------------------------------------

// ノードA: 生成担当 (Generator)
// 指示に基づいてプロフィールを作る
async function generatorNode(state: typeof GraphState.State) {
  console.log(`\n🤖 [Generator] 生成中... (回数: ${state.retryCount + 1})`);
  
  const prompt = `
    以下の要件に基づいて、架空のクリエイターのプロフィールを作ってください。
    150文字以内で、少し変わった癖のある人物にしてください。
    
    もし「フィードバック」がある場合は、それを反映して修正してください。
    
    要件: ${state.messages[0].content}
    ${state.feedback ? `前回のフィードバック: ${state.feedback}` : ""}
  `;

  const result = await llm.invoke(prompt);
  
  return {
    profileDraft: result.content as string,
    retryCount: state.retryCount + 1,
  };
}

// ノードB: 評価担当 (Critic)
// プロフィールを見て、OKかNGかを判定する
async function criticNode(state: typeof GraphState.State) {
  console.log(`\n🧐 [Critic] 審査中...`);
  console.log(`   案: ${state.profileDraft.replace(/\n/g, ' ')}`); // ログ用に改行削除

  const prompt = `
    あなたは厳しい審査員です。以下のプロフィールを評価してください。
    
    プロフィール: "${state.profileDraft}"
    
    要件: "${state.messages[0].content}"

    【判定基準】
    - 「平凡」「普通」なものはNG。
    - ユニークで尖っているものはOK。
    
    回答は以下のフォーマットのみで答えてください。
    OKの場合: "OK"
    NGの場合: "NG: [修正すべき具体的なアドバイス]"
  `;

  const result = await llm.invoke(prompt);
  const content = result.content as string;

  if (content.startsWith("OK")) {
    return { feedback: "OK" };
  } else {
    return { feedback: content };
  }
}

// ---------------------------------------------------------
// 4. グラフの構築 (Wiring)
// ---------------------------------------------------------
const workflow = new StateGraph(GraphState)
  // ノードを追加
  .addNode("generator", generatorNode)
  .addNode("critic", criticNode)

  // エッジ（矢印）をつなぐ
  .addEdge(START, "generator") // スタート -> 生成
  .addEdge("generator", "critic") // 生成 -> 審査

  // 条件付きエッジ（分岐）
  .addConditionalEdges(
    "critic", // 審査ノードの後に分岐
    (state) => {
      // 分岐ロジック
      if (state.feedback === "OK") {
        return "approved";
      }
      if (state.retryCount >= 3) {
        console.log("⚠️ 諦めました（リトライ上限）");
        return "approved"; // 無限ループ防止のため強制終了
      }
      return "rejected";
    },
    {
      // 戻り値と次のノードの対応表
      approved: END,      // OKなら終了
      rejected: "generator" // NGなら生成に戻る（ループ！）
    }
  );

// コンパイル（実行可能なアプリにする）
const app = workflow.compile();

// ---------------------------------------------------------
// 5. 実行
// ---------------------------------------------------------
async function main() {
  const initialInput = {
    messages: [new HumanMessage("SF風のアクセサリー作家")],
  };

  console.log("🚀 ワークフロー開始\n");

  // streamで実行経過を受け取る
  const stream = await app.stream(initialInput);

  for await (const chunk of stream) {
    // 各ステップの更新内容が表示される
    console.log(chunk); 
  }

  console.log("\n✅ 完了しました");
}

main().catch(console.error);