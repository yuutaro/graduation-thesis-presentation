export type SimulatedUser = {
  tempId: string;
  publicId: string; // Meaningful ID for URL
  name: string;
  bio: string;
  role: "LEADER" | "MEMBER" | "SOLO" | "PROXY";
};

export type SimulatedProject = {
  tempId: string;
  publicId: string; // Meaningful ID for URL
  ownerId: string;
  name: string;
  description: string;
  mode: "COOPERATIVE" | "MANAGED" | "THEME" | "INDIVIDUAL";
  memberIds: string[];
};

export type SimulatedItem = {
  tempId: string;
  publicId: string; // Meaningful ID for URL
  authorId: string;
  projectId: string | null;
  name: string;
  description: string;
};

// 1つの生成単位
export type ScenarioCluster = {
  category: string;
  structureType: string;
  theme: string;
  users: SimulatedUser[];
  projects: SimulatedProject[];
  items: SimulatedItem[];
};

// 生成タスクの指示書
export type GenerationTask = {
  id: string;
  category: string;
  structureType: string;
  // Designerによって立案された具体的なコンセプト指示
  concept?: {
    theme: string;       // "ライバル関係にある大学サークル"
    keywords: string[];  // ["旧キット", "セメント", "合わせ目"]
    tone: string;        // "マニアックかつ批判的"
    avoid: string[];     // ["初心者", "素組み"] (これらは避ける)
  };
};

export type ExperimentConfig = {
  experimentMode: boolean;
  outputFilePath?: string;
  enableVectorSearch?: boolean;
  runId?: string;
  modelName?: string;
  temperature?: number;
};
