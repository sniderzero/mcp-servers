import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { ALL_TOOL_DEFINITIONS, getToolHandler } from "./tools/index.js";
import type { ControlUpClient } from "./api/client.js";
import { ControlUpApiError } from "./api/client.js";

export function createServer(client: ControlUpClient): Server {
  const server = new Server(
    { name: "controlup-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOL_DEFINITIONS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const handler = getToolHandler(name);
    if (!handler) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    try {
      const result = await handler(args ?? {}, client);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      if (err instanceof ControlUpApiError) {
        throw new McpError(
          ErrorCode.InternalError,
          `ControlUp API error ${err.status}: ${err.body}`,
        );
      }
      throw err;
    }
  });

  return server;
}
