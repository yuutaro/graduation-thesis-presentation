import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve absolute path to the backend directory
// agent/src/utils -> agent/src -> agent -> root -> backend
const BACKEND_DIR = path.resolve(__dirname, '../../../backend');

export class McpClient {
  /**
   * Invokes the 'save_scenario_cluster' tool on the backend MCP server.
   * Spawns the backend script as a subprocess using StdioClientTransport.
   */
  static async saveScenarioCluster(clusterData: any): Promise<any> {
    console.log('--- MCP Client: Saving Scenario Cluster ---');
    console.log(`Target Backend Dir: ${BACKEND_DIR}`);

    // Initialize MCP Client
    const client = new Client(
      {
        name: "ArtSquare-Agent-Client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    // Setup Transport
    // We run the command inside the backend directory to resolve dependencies correctly.
    // Using bash -c to change directory before execution.
    const transport = new StdioClientTransport({
      command: "bash",
      args: [
        "-c",
        `cd "${BACKEND_DIR}" && npx tsx scripts/mcp-server.ts`
      ],
      env: process.env // Explicitly inherit environment variables (including DATABASE_URL)
    });

    try {
      await client.connect(transport);
      console.log('MCP Client: Connected to server process');

      // Call the tool
      const result = await client.callTool({
        name: "save_scenario_cluster",
        arguments: clusterData
      });

      console.log('MCP Client: Tool execution successful');
      return result;

    } catch (error) {
      console.error("MCP Client Error:", error);
      throw error;
    } finally {
      // Ensure the connection and subprocess are closed
      try {
        await client.close();
      } catch (e) {
        // Ignore errors during closure
      }
    }
  }

  /**
   * Invokes the 'cleanup_test_data' tool on the backend MCP server.
   * Deletes users and their related data by publicIds.
   */
  static async cleanupTestData(userPublicIds: string[]): Promise<any> {
    console.log('--- MCP Client: Cleaning up Test Data ---');
    console.log(`Target Backend Dir: ${BACKEND_DIR}`);
    console.log(`Target Users: ${userPublicIds.join(', ')}`);

    const client = new Client(
      { name: "ArtSquare-Agent-Client-Cleanup", version: "1.0.0" },
      { capabilities: {} }
    );

    const transport = new StdioClientTransport({
      command: "bash",
      args: ["-c", `cd "${BACKEND_DIR}" && npx tsx scripts/mcp-server.ts`],
      env: process.env 
    });

    try {
      await client.connect(transport);
      console.log('MCP Client: Connected to server process');

      const result = await client.callTool({
        name: "cleanup_test_data",
        arguments: { userPublicIds }
      });

      console.log('MCP Client: Cleanup execution successful');
      return result;

    } catch (error) {
      console.error("MCP Client Error (Cleanup):", error);
      throw error;
    } finally {
      try {
        await client.close();
      } catch (e) {}
    }
  }

  /**
   * Invokes the 'cleanup_test_data' tool with userIds (integers).
   */
  static async cleanupTestDataByIds(userIds: number[]): Promise<any> {
    console.log('--- MCP Client: Cleaning up Test Data by IDs ---');
    console.log(`Target Backend Dir: ${BACKEND_DIR}`);
    console.log(`Target User IDs: ${userIds.join(', ')}`);

    const client = new Client(
      { name: "ArtSquare-Agent-Client-Cleanup-Ids", version: "1.0.0" },
      { capabilities: {} }
    );

    const transport = new StdioClientTransport({
      command: "bash",
      args: ["-c", `cd "${BACKEND_DIR}" && npx tsx scripts/mcp-server.ts`],
      env: process.env 
    });

    try {
      await client.connect(transport);
      console.log('MCP Client: Connected to server process');

      const result = await client.callTool({
        name: "cleanup_test_data",
        arguments: { userIds }
      });

      console.log('MCP Client: Cleanup execution successful');
      return result;

    } catch (error) {
      console.error("MCP Client Error (Cleanup IDs):", error);
      throw error;
    } finally {
      try {
        await client.close();
      } catch (e) {}
    }
  }
}
