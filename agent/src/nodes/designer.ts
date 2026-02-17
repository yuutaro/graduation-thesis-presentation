import { GenerationTask, ExperimentConfig } from "../types.js";
import { z } from "zod";
import { DbUtils } from "../utils/db.js";
import { RunnableConfig } from "@langchain/core/runnables";
import { createChatModel, createEmbeddings } from "../utils/model-factory.js";

// コンセプト生成用のZodスキーマ
const ConceptSchema = z.object({
  theme: z.string().describe("シナリオのテーマ（例: 'ライバル関係にある大学サークル'）"),
  keywords: z.array(z.string()).describe("シナリオを特徴づけるキーワード3-5個"),
  tone: z.string().describe("説明文のトーン（例: 'マニアックかつ批判的', 'ほのぼの'）"),
  avoid: z.array(z.string()).describe("差別化のために避けるべき要素"),
  summaryForCheck: z.string().describe("重複チェック用の短いあらすじ"),
});

export const designerNode = async (state: { task: GenerationTask }, config?: RunnableConfig) => {
  const { task } = state;
  console.log(`--- Designer Thinking about: ${task.category} / ${task.structureType} ---`);

  let existingConcepts = "(まだありません)";

  // Check if vector search is enabled via config (experiment) or environment variable
  const expConfig = config?.configurable as ExperimentConfig | undefined;
  
  const enableVectorSearch = expConfig?.enableVectorSearch !== undefined
    ? expConfig.enableVectorSearch
    : process.env.ENABLE_VECTOR_SEARCH !== "false";

  if (enableVectorSearch) {
    try {
      // 1. ベクトル検索で類似シナリオを検索
      // 検索用のクエリベクトルを生成 (Category + StructureType をキーにする)
      const queryText = `Category: ${task.category}, Structure: ${task.structureType}`;
      
      const embeddings = createEmbeddings();
      
      // Note: In a real scenario, we might want to cache this or use a lightweight local embedding for speed,
      // but here we use the same model as we will for storage.
      const vector = await embeddings.embedQuery(queryText);
      
      const similarScenarios = DbUtils.searchSimilarScenarios(vector, 5);
      
      if (similarScenarios.length > 0) {
        existingConcepts = similarScenarios.map(s => `- ${s.concept} (Distance: ${s.distance.toFixed(4)})`).join("\n");
        console.log(`Designer: Found ${similarScenarios.length} similar scenarios.`);
      }

    } catch (err) {
      console.warn("Designer: Vector search failed (skipping context):", err);
    }
  } else {
    console.log("Designer: Vector search SKIPPED (ENABLE_VECTOR_SEARCH=false).");
    existingConcepts = "(今回は考慮しません)";
  }

  // 2. LLMによる企画立案
  const temperature = expConfig?.temperature ?? 0.9;
  const model = createChatModel(expConfig?.modelName, temperature);

  const structuredModel = model.withStructuredOutput(ConceptSchema);

  // 類似シナリオセクションの構築 (RAGが有効な場合のみ含める)
  const existingScenariosSection = enableVectorSearch 
    ? `
  ## 既存の類似シナリオ（これらと被らないようにしてください！）
  ${existingConcepts}
    `
    : "";

  const systemPrompt = `
  あなたはテストデータ生成のための「構成作家」です。
  指定された「カテゴリ」と「構造タイプ」に基づいて、具体的でユニークなシナリオのコンセプトを立案してください。

  ## プラットフォームの定義
  このプラットフォームは、**現実世界のユーザー**が、自分の制作した**作品（模型、手芸、イラストなど）**やコレクションを展示・売買するためのCtoCサービス（ArtSquare）です。
  **作中の登場人物や兵器そのものを生成するのではなく、「それを趣味として楽しむ人々」のシナリオを作成してください。**

  ## 現在のオーダー
  - カテゴリ: ${task.category}
  - 構造タイプ: ${task.structureType}

  ## カテゴリの解釈ガイド
  - **PLASTIC_MODEL**: ガンプラ、スケールモデル（戦車、飛行機、車）、キャラクターキット、ジオラマ、美少女フィギュアなど。
  - **HANDCRAFT**: 手芸、アクセサリー、編み物、レザー、陶芸など。
  - **GADGET**: 電子工作、3Dプリンター造形物、ロボット工作キット、ドローン、廃材アート、IoTデバイスなど。
  ${existingScenariosSection}
  ## 指示
  - 既存のシナリオとは異なる視点、設定、トーンで企画してください。
  - ニッチな設定や、エッジの効いた設定を歓迎します。
  `;

  try {
    const concept = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: "新しいコンセプトを1つ提案してください。" }
    ]);

    console.log(`Designer: Created concept "${concept.theme}"`);

    // 3. Taskにコンセプトを付与して返す
    return {
      task: {
        ...task,
        concept: {
          theme: concept.theme,
          keywords: concept.keywords,
          tone: concept.tone,
          avoid: concept.avoid
        }
      }
    };

  } catch (error) {
    console.error("Designer Error:", error);
    // エラー時はコンセプトなしでScenaristに任せる（フォールバック）
    return { task };
  }
};
