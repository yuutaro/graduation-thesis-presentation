import { v4 as uuidv4 } from 'uuid';
import { OverallState } from "../state.js";
import { GenerationTask, ExperimentConfig } from "../types.js";
import { RunnableConfig } from "@langchain/core/runnables";

// 分布マトリクス定義
// カテゴリごとに、どの構造タイプが選ばれやすいかの重み付け (合計100になるように)
const DISTRIBUTION_MATRIX: Record<string, Record<string, number>> = {
  "PLASTIC_MODEL": { // 旧: GUNDAM。組織や個人が多い
    "ORGANIZATION": 40,
    "INDIVIDUAL": 40,
    "COMMUNITY": 20,
    "PROXY": 0
  },
  "HANDCRAFT": { // 手芸系: コミュニティや代理が多い
    "COMMUNITY": 50,
    "PROXY": 30,
    "ORGANIZATION": 10,
    "INDIVIDUAL": 10
  },
  "GADGET": { // 旧: MECHANICAL。組織（大学サークル）が多い
    "ORGANIZATION": 60,
    "INDIVIDUAL": 30,
    "COMMUNITY": 10,
    "PROXY": 0
  },
  // 定義がないカテゴリ用のデフォルト
  "DEFAULT": {
    "INDIVIDUAL": 50,
    "ORGANIZATION": 20,
    "COMMUNITY": 20,
    "PROXY": 10
  }
};

// 重みに基づいてランダムにキーを選択するヘルパー関数
const pickStructureType = (category: string): string => {
  const matrix = DISTRIBUTION_MATRIX[category] || DISTRIBUTION_MATRIX["DEFAULT"];
  const rand = Math.random() * 100;
  let sum = 0;
  
  for (const [type, weight] of Object.entries(matrix)) {
    sum += weight;
    if (rand < sum) return type;
  }
  return "INDIVIDUAL"; // fallback
};

export const directorNode = async (state: typeof OverallState.State, config?: RunnableConfig) => {
  console.log("--- Director: Analyzing Distribution ---");
  const { targetDistribution, generatedClusters } = state;
  const newTasks: GenerationTask[] = [];

  const expConfig = config?.configurable as ExperimentConfig | undefined;
  const isExperiment = expConfig?.experimentMode ?? false;

  // 1. 現状の集計
  const currentCounts = generatedClusters.reduce((acc, cluster) => {
    acc[cluster.category] = (acc[cluster.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 2. 不足分の計算とタスク生成
  for (const [category, targetCount] of Object.entries(targetDistribution)) {
    const current = currentCounts[category] || 0;
    
    if (current < targetCount) {
      const needed = targetCount - current;
      // 並列数を制御
      // 実験モード: 直列実行のため1 (他カテゴリとの並列も防ぐためループbreakする)
      // 通常モード: 最大3つまで並列
      const limit = isExperiment ? 1 : 3;
      const batchSize = Math.min(needed, limit);
      
      console.log(`Director: Category '${category}' needs ${needed} more. Scheduling ${batchSize} tasks.`);

      for (let i = 0; i < batchSize; i++) {
        // ★ここでマトリクスを使って構造タイプを決定！
        const structureType = pickStructureType(category);
        
        newTasks.push({
          id: uuidv4(),
          category,
          structureType
        });
      }

      // 実験モードなら、1つのカテゴリからタスクを作ったらループを抜ける（完全直列化）
      if (isExperiment && newTasks.length >= 1) break;
    }
  }

  if (newTasks.length === 0) {
    console.log("Director: All targets met. Moving to Finalize.");
  }

  return { pendingTasks: newTasks };
};