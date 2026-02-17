import { OverallState } from "../state.js";
import { McpClient } from "../utils/mcp-client.js";
import { DbUtils } from "../utils/db.js";
import { RunnableConfig } from "@langchain/core/runnables";
import * as fs from 'fs';
import { ExperimentConfig } from "../types.js";
import { createEmbeddings } from "../utils/model-factory.js";

export const saverNode = async (state: typeof OverallState.State, config?: RunnableConfig) => {
  console.log("\n==================================================");
  console.log("   SAVER: PERSISTING DATA");
  console.log("==================================================\n");

  const expConfig = config?.configurable as ExperimentConfig | undefined;
  const isExperiment = expConfig?.experimentMode ?? false;

  const embeddings = createEmbeddings();

  for (const [index, cluster] of state.generatedClusters.entries()) {
    console.log(`\n[Saving Cluster #${index + 1}] ${cluster.theme || "Untitled"}`);

    // Generate Embedding for the scenario concept (needed for both DB and Experiment)
    const scenarioText = `
      Category: ${cluster.category}
      Type: ${cluster.structureType}
      Theme: ${cluster.theme}
      Users: ${cluster.users.map(u => u.name).join(", ")}
      Items: ${cluster.items.map(i => i.name).join(", ")}
    `.trim();

    console.log("  -> Generating embedding vector...");
    let vector: number[] = [];
    try {
      vector = await embeddings.embedQuery(scenarioText);
    } catch (e) {
      console.error("  ⚠️ Failed to generate embedding:", e);
      // Fallback to empty vector or continue without it
    }

    // --- Experiment Mode: Save to JSONL ---
    if (isExperiment) {
      console.log(`  -> [Experiment] Saver node skipped (Data will be handled by runner).`);
      // Skip DB saving in experiment mode
      continue;
    }

    // --- Normal Mode: Save to DB ---
    try {
      // 1. Send to Backend via MCP
      console.log("  -> Sending to Backend via MCP...");
      const result = await McpClient.saveScenarioCluster(cluster);
      
      const contentText = result.content[0].text;
      console.log(`DEBUG: MCP Response: ${contentText}`); // Debug log

      // Parse the result to get real ID mappings
      const response = JSON.parse(contentText);
      const idMapping: Record<string, number> = response.idMap;
      
      console.log(`  -> Backend saved. Received ${Object.keys(idMapping).length} ID mappings.`);

      // 3. Save to Agent DB (Scenario + Vector)
      console.log("  -> Saving to Agent DB (Scenarios & Vector)...");
      const metadata = {
        category: cluster.category,
        structureType: cluster.structureType,
        userCount: cluster.users.length,
        itemCount: cluster.items.length
      };

      const scenarioId = DbUtils.insertScenario(cluster.theme || "Untitled Scenario", metadata, vector);
      console.log(`  -> Scenario stored with ID: ${scenarioId}`);

      // 4. Save Artifact Logs (ID Mapping)
      console.log("  -> Saving Artifact Logs...");
      let logCount = 0;
      for (const [tempId, realId] of Object.entries(idMapping)) {
        DbUtils.insertArtifactLog(scenarioId, tempId, String(realId));
        logCount++;
      }
      console.log(`  -> Logged ${logCount} artifact mappings.`);

    } catch (error) {
      console.error(`  ❌ Failed to save cluster #${index + 1}:`, error);
    }
  }

  console.log("\n==================================================");
  console.log(`Saver process completed.`);
  
  // Return empty object as we don't update global state here, just side effects
  return {};
};
