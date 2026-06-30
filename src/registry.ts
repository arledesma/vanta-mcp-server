import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getEnabledToolNames,
  hasEnabledToolFilter,
  isToolEnabled,
  isWritesEnabled,
} from "./config.js";

// Tool definition interface (matches our Tool pattern)
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodTypeAny;
}

// Tool registry interface for operations modules
export interface ToolEntry {
  tool: ToolDefinition;
  handler: (args: z.infer<z.ZodTypeAny>) => Promise<CallToolResult>;
  // When true, the tool is only registered if writes are enabled
  // (--dangerously-allow-writes). Used to gate mutating tools.
  requiresWrites?: boolean;
}

export interface OperationModule {
  tools: ToolEntry[];
}

// Helper function to register a single tool
export function registerTool(
  server: McpServer,
  tool: ToolDefinition,
  handler: (args: z.infer<z.ZodTypeAny>) => Promise<CallToolResult>,
  entry: Pick<ToolEntry, "requiresWrites"> = {},
): boolean {
  if (entry.requiresWrites && !isWritesEnabled()) {
    console.error(
      `🔒 Skipping write tool (--dangerously-allow-writes not set): ${tool.name}`,
    );
    return false;
  }

  if (!isToolEnabled(tool.name)) {
    console.error(`⚪️ Skipping tool not in enabled list: ${tool.name}`);
    return false;
  }

  const parameters = tool.parameters as z.ZodObject<z.ZodRawShape>;
  // The SDK's tool() overloads use ZodRawShapeCompat (from its internal zod-compat
  // layer) which TypeScript cannot resolve without hitting the TS2589 "excessively
  // deep type instantiation" limit when inferring against z.ZodRawShape's index
  // signature. The cast via unknown is safe: at runtime the SDK accepts a plain
  // ZodRawShape (Record<string, ZodTypeAny>) exactly as before.
  type ToolFn = (
    name: string,
    description: string,
    shape: z.ZodRawShape,
    handler: (args: Record<string, unknown>) => Promise<CallToolResult>,
  ) => void;
  (server.tool as unknown as ToolFn)(
    tool.name,
    tool.description,
    parameters.shape,
    handler,
  );
  return true;
}

// Helper function to register all tools from a module
export function registerOperationModule(
  server: McpServer,
  operationModule: OperationModule,
): { registered: number; skipped: number } {
  let registered = 0;
  let skipped = 0;

  operationModule.tools.forEach(({ tool, handler, requiresWrites }) => {
    const wasRegistered = registerTool(server, tool, handler, {
      requiresWrites,
    });
    if (wasRegistered) {
      registered += 1;
    } else {
      skipped += 1;
    }
  });

  return { registered, skipped };
}

// Auto-discovery and registration of all operations
export async function registerAllOperations(server: McpServer): Promise<void> {
  // Import all operation modules
  const operations = [
    import("./operations/tests.js"),
    import("./operations/frameworks.js"),
    import("./operations/controls.js"),
    import("./operations/risks.js"),
    import("./operations/integrations.js"),
    import("./operations/vendors.js"),
    import("./operations/documents.js"),
    import("./operations/policies.js"),
    import("./operations/discovered-vendors.js"),
    import("./operations/groups.js"),
    import("./operations/people.js"),
    import("./operations/vulnerabilities.js"),
    import("./operations/vulnerability-remediations.js"),
    import("./operations/vulnerable-assets.js"),
    import("./operations/monitored-computers.js"),
    import("./operations/vendor-risk-attributes.js"),
    import("./operations/trust-centers.js"),
    // Write operation modules (tools gated behind --dangerously-allow-writes)
    import("./operations/write-vulnerabilities.js"),
    import("./operations/write-tests.js"),
    import("./operations/write-people.js"),
    import("./operations/write-controls.js"),
    import("./operations/write-documents.js"),
    import("./operations/write-risks.js"),
  ];

  // Load all modules and register their tools
  const modules = await Promise.all(operations);

  let totalTools = 0;
  let skippedTools = 0;
  modules.forEach(module => {
    const operationModule = module.default;
    const { registered, skipped } = registerOperationModule(
      server,
      operationModule,
    );
    totalTools += registered;
    skippedTools += skipped;
  });

  console.error(
    `✅ Registered ${String(totalTools)} tools from ${String(modules.length)} operation modules successfully`,
  );

  if (skippedTools > 0 && hasEnabledToolFilter) {
    const enabledList = getEnabledToolNames().join(", ");
    console.error(
      `⚠️ Tools skipped because they are not enabled: ${String(skippedTools)} (enabled list: ${enabledList})`,
    );
  }
}
