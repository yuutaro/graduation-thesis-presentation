import { Annotation } from "@langchain/langgraph";
import { ScenarioCluster, GenerationTask } from "./types.js";

export const OverallState = Annotation.Root({
  // 入力: 目標とする分布 (例: { "GUNDAM": 2, "HANDCRAFT": 1 })
  targetDistribution: Annotation<Record<string, number>>({
    reducer: (curr, next) => next,
    default: () => ({}),
  }),

  // 次に実行すべきタスク (Director -> Scenarist)
  pendingTasks: Annotation<GenerationTask[]>({
    reducer: (curr, next) => next, // 常に上書き
    default: () => [],
  }),

  // 成果物リスト (Scenarist -> Result Pool)
  generatedClusters: Annotation<ScenarioCluster[]>({
    reducer: (curr, next) => [...curr, ...next], // 追加
    default: () => [],
  }),
});

export const GenerationState = Annotation.Root({
  task: Annotation<GenerationTask>({
    reducer: (x, y) => y ?? x,
    default: () => undefined as any,
  }),
  generatedClusters: Annotation<ScenarioCluster[]>({
    reducer: (curr, next) => [...curr, ...next],
    default: () => [],
  }),
});
