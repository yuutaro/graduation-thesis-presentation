import 'dotenv/config';
import { graph } from './graph.js';

async function main() {
  // recursionLimitを1000に設定して、大量の生成タスクによる再帰制限エラーを回避する
  const config = { 
    configurable: { thread_id: "test-thread" },
    recursionLimit: 1000
  };
  
  // 初期入力
  const inputs = {
    targetDistribution: {
      "GUNDAM": 2, // 2件生成する
      "HANDCRAFT": 2,
      "MECHANICAL": 1,
      "DEFAULT": 1
    },
    // 初期状態は空
    pendingTasks: [],
    generatedClusters: []
  };

  console.log("--- Starting Generation Pipeline ---");

  // streamで実行し、イベントを確認
  const stream = await graph.stream(inputs, config);

  for await (const chunk of stream) {
    const nodeName = Object.keys(chunk)[0];
    const content = chunk[nodeName];
    console.log(`\n=== Node Completed: ${nodeName} ===`);
    // console.log(JSON.stringify(content, null, 2));
    
    // Scenaristの出力の場合、生成されたコンセプトや数を表示
    if (nodeName === "scenarist" && content.generatedClusters) {
        console.log(`Generated ${content.generatedClusters.length} clusters.`);
        content.generatedClusters.forEach((c: any) => {
             console.log(`- Theme: ${c.theme} (${c.structureType})`);
        });
    }
  }

  console.log("\n--- Pipeline Finished ---");
}

main().catch(err => {
  console.error("Fatal Error:", err);
});
