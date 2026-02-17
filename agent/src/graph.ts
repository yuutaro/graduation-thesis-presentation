import { StateGraph, START, END, Send } from "@langchain/langgraph";
import { OverallState, GenerationState } from "./state.js";
import { directorNode } from "./nodes/director.js";
import { designerNode } from "./nodes/designer.js";
import { scenaristNode } from "./nodes/scenarist.js";
import { saverNode } from "./nodes/saver.js";

// --- Subgraph Definition (Designer -> Scenarist) ---
const generationWorkflow = new StateGraph(GenerationState)
  .addNode("designer", designerNode)
  .addNode("scenarist", scenaristNode)
  .addEdge(START, "designer")
  .addEdge("designer", "scenarist")
  .addEdge("scenarist", END);

const generationGraph = generationWorkflow.compile();

// --- Main Graph Definition ---

// 条件分岐ロジック
const routeAfterDirector = (state: typeof OverallState.State) => {
  const { pendingTasks } = state;
  
  if (pendingTasks.length > 0) {
    console.log(`-> Routing to Generator (${pendingTasks.length} tasks)`);
    // Subgraphにタスクを投げる
    return pendingTasks.map(task => new Send("generator", { task }));
  } else {
    console.log("-> Routing to Saver");
    return "saver";
  }
};

const workflow = new StateGraph(OverallState)
  .addNode("director", directorNode)
  .addNode("generator", generationGraph) // Subgraphをノードとして登録
  .addNode("saver", saverNode)

  // フロー定義
  .addEdge(START, "director")
  .addConditionalEdges("director", routeAfterDirector, ["generator", "saver"])
  
  // Generator(Subgraph)が終わったらDirectorに戻る（ループして不足分を再チェック）
  .addEdge("generator", "director")
  
  .addEdge("saver", END);

// グラフのコンパイル
export const graph = workflow.compile();
