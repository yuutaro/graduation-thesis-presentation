import { z } from "zod";
import { GenerationTask, ExperimentConfig } from "../types.js";
import { createChatModel } from "../utils/model-factory.js";
import { RunnableConfig } from "@langchain/core/runnables";

// ==========================================
// 1. Zod Schema Definitions
// LLMに出力させるJSONの形を厳密に定義します
// ==========================================

// User: 役割とプロフィール
const SimulatedUserSchema = z.object({
  tempId: z.string().describe("一意な仮ID (例: u_leader, u_member_a)"),
  publicId: z.string().regex(/^[a-zA-Z0-9-_]+$/).describe("URL用ID。英数字とハイフンのみ。ユーザー名を反映させる (例: 'gundam-meister-setsuna')"),
  name: z.string().describe("ユーザー名 (リアリティのあるハンドルネーム)"),
  bio: z.string().describe("プロフィール文。文体や内容でキャラを表現する"),
  role: z.enum(["LEADER", "MEMBER", "SOLO", "PROXY"]).describe("シナリオ内での役割"),
});

// Project: 企画・イベント
const SimulatedProjectSchema = z.object({
  tempId: z.string().describe("一意な仮ID (例: p_main)"),
  publicId: z.string().regex(/^[a-zA-Z0-9-_]+$/).describe("URL用ID。英数字とハイフンのみ。プロジェクト名を反映させる (例: 'operation-meteor')"),
  ownerId: z.string().describe("主催者のUser tempId"),
  name: z.string().describe("プロジェクト名 (企画名やイベント名)"),
  description: z.string().describe("プロジェクトの詳細説明 (Markdown形式)"),
  mode: z.enum(["COOPERATIVE", "MANAGED", "THEME", "INDIVIDUAL"]).describe("プロジェクトの運営モード"),
  memberIds: z.array(z.string()).describe("参加メンバーのUser tempIdリスト"),
});

// Item: 作品
const SimulatedItemSchema = z.object({
  tempId: z.string().describe("一意な仮ID (例: i_item_1)"),
  publicId: z.string().regex(/^[a-zA-Z0-9-_]+$/).describe("URL用ID。英数字とハイフンのみ。作品名を反映させる (例: 'rx-78-2-ver-ka')"),
  authorId: z.string().describe("作者のUser tempId"),
  projectId: z.string().nullable().describe("紐づくProjectのtempId。個人の場合はnull"),
  name: z.string().describe("作品名"),
  description: z.string().describe("作品の解説文 (Markdown形式)。制作過程やこだわりを詳細に記述"),
});

// Root Schema: シナリオ全体
const ScenarioClusterSchema = z.object({
  category: z.string(),
  structureType: z.string(),
  theme: z.string().describe("このシナリオの具体的なテーマ (例: '廃材を使ったロボット製作')"),
  users: z.array(SimulatedUserSchema),
  projects: z.array(SimulatedProjectSchema),
  items: z.array(SimulatedItemSchema),
});

// ==========================================
// 2. Node Implementation
// ==========================================

export const scenaristNode = async (state: { task: GenerationTask }, config?: RunnableConfig) => {
  const { task } = state;
  // Debug log to inspect state
  if (!task) {
    console.error("Scenarist Error: Task is undefined in state:", JSON.stringify(state));
    return { generatedClusters: [] };
  }

  console.log(`--- Scenarist AI Working on: ${task.category} / ${task.structureType} ---`);

  // モデルの初期化 (ファクトリー使用)
  const expConfig = config?.configurable as ExperimentConfig | undefined;
  const temperature = expConfig?.temperature ?? 0.7;
  const model = createChatModel(expConfig?.modelName, temperature);

  // 構造化出力を有効化
  // GeminiもwithStructuredOutputに対応しています
  const structuredModel = model.withStructuredOutput(ScenarioClusterSchema);

  // コンセプト指示の有無でプロンプトを分岐
  const conceptInstructions = task.concept 
    ? `
    ## コンセプト指示書 (Designerからの指定)
    以下の設定を厳守して詳細を生成してください。
    - **テーマ**: ${task.concept.theme}
    - **キーワード**: ${task.concept.keywords.join(", ")} (これらを説明文に盛り込むこと)
    - **トーン**: ${task.concept.tone}
    - **避けるべき要素**: ${task.concept.avoid.join(", ")}
    `
    : "";

  // システムプロンプトの構築
  const systemPrompt = `
  あなたは架空のクリエイタープラットフォーム(ArtSquare)のデータを生成する「脚本家」です。
  与えられた「カテゴリ」と「社会構造(Structure Type)」に基づいて、
  整合性の取れた一つの小さな社会（シナリオクラスター）を生成してください。

  ## 重要な前提
  - ArtSquareは**CtoCの創作・ホビー・コレクションのプラットフォーム**です。
  - 生成される**Item**は、現実的に個人が売買・展示できるもの（模型、手芸品、同人誌、素材、データなど）に限られます。
  - **カテゴリが"PLASTIC_MODEL"の場合、Itemは「ガンプラ」「フィギュア」「ジオラマ」「関連グッズ」などであり、本物の兵器ではありません。**
  - Userは「それを作る/集める趣味人」や「プロモデラー」「ショップ」などとして描いてください。

  ## 入力条件
  - カテゴリ: ${task.category}
  - 構造タイプ: ${task.structureType}
  ${conceptInstructions}

  ## 構造タイプの定義
  1. ORGANIZATION (組織型):
    - 明確なリーダー(LEADER)が存在し、プロジェクト(MANAGED/COOPERATIVE)を管理する。
    - メンバーはプロジェクトに参加し、作品はプロジェクトに紐づく。
    - 文脈: 大学サークル、企業の部活動など。

  2. COMMUNITY (コミュニティ型):
    - フラットな関係。リーダーは世話役程度。
    - 互いに緩く繋がり、プロジェクト(THEME/COOPERATIVE)を共有する。
    - 文脈: ママ友の手芸会、社会人の同好会。

  3. PROXY (代理投稿型):
    - 職員/親(PROXY)がアカウント管理・プロジェクト作成を行う。
    - 実際の作者(MEMBER/SOLO)は操作を行わない設定。
    - 文脈: 老人ホームのレクレーション、子供の作品展示。

  4. INDIVIDUAL (個人型):
    - 孤高のクリエイター(SOLO)。
    - プロジェクトは持たないか、個人のポートフォリオ用(INDIVIDUAL)のみ。
    - 文脈: YouTuber、職人。

  ## 制約事項
  - User, Project, Item の各データを作成すること。
  - **tempId** を使用して、生成データ内で矛盾のないリレーションを構築すること。
  - **publicId** はURLの一部として使用されるため、英数字とハイフンのみで構成し、内容（名前やテーマ）を反映した可読性の高い文字列にすること（乱数は使わないこと）。
  - DescriptionはMarkdown形式で、読み応えのある記事のように書くこと。
  - Bioや説明文の口調は、設定された「ペルソナ」や「カテゴリの文化」に合わせること。
  `;

  try {
    // 生成実行
    const result = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: "最高にリアリティのあるシナリオデータを生成してください。" },
    ]);

    // 結果の返却
    return { generatedClusters: [result] };

  } catch (error) {
    console.error("AI Generation Failed:", error);
    // エラー時は空配列を返す
    return { generatedClusters: [] };
  }
};