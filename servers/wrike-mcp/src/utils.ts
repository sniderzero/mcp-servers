import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z, ZodRawShape } from "zod";
import { WrikeClient, WrikeApiError } from "./client.js";
import { paginationParams } from "./schemas/common.js";

type CallToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export async function handleApiCall<T>(fn: () => Promise<T>): Promise<CallToolResult> {
  try {
    const result = await fn();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    if (error instanceof WrikeApiError) {
      return {
        content: [{ type: "text", text: `Wrike API Error (${error.statusCode}): ${error.message}` }],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export interface CrudConfig {
  /** Singular resource name for tool names, e.g., "task" */
  resourceName: string;
  /** Plural resource name for tool names, e.g., "tasks" */
  resourceNamePlural: string;
  /** API path prefix, e.g., "/tasks" */
  apiPath: string;
  /** Zod shape for create params */
  createShape: ZodRawShape;
  /** Zod shape for update params (excluding id) */
  updateShape: ZodRawShape;
  /** Description prefix for tools */
  description: string;
  /** Extra Zod shape fields for list params (merged with pagination) */
  listShape?: ZodRawShape;
  /** Whether to skip delete tool */
  skipDelete?: boolean;
  /** Whether to skip get single tool */
  skipGet?: boolean;
}

export function registerCrudTools(
  server: McpServer,
  client: WrikeClient,
  config: CrudConfig
): void {
  const {
    resourceName,
    resourceNamePlural,
    apiPath,
    createShape,
    updateShape,
    description,
    listShape,
    skipDelete,
    skipGet,
  } = config;

  // CREATE
  server.tool(
    `wrike_create_${resourceName}`,
    `Create a new ${description}`,
    createShape,
    async (args) => handleApiCall(() => client.post(`${apiPath}`, args))
  );

  // GET
  if (!skipGet) {
    server.tool(
      `wrike_get_${resourceName}`,
      `Get a ${description} by ID`,
      { id: z.string().describe(`The ${resourceName} ID`) },
      async (args) => handleApiCall(() => client.get(`${apiPath}/${args.id}`))
    );
  }

  // LIST
  const listSchemaShape: ZodRawShape = {
    ...paginationParams.shape,
    ...(listShape || {}),
  };
  server.tool(
    `wrike_list_${resourceNamePlural}`,
    `List ${description}s`,
    listSchemaShape,
    async (args) => {
      const { ...params } = args;
      return handleApiCall(() => client.get(`${apiPath}`, params));
    }
  );

  // UPDATE
  server.tool(
    `wrike_update_${resourceName}`,
    `Update a ${description}`,
    {
      id: z.string().describe(`The ${resourceName} ID`),
      ...updateShape,
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() => client.put(`${apiPath}/${id}`, body));
    }
  );

  // DELETE
  if (!skipDelete) {
    server.tool(
      `wrike_delete_${resourceName}`,
      `Delete a ${description}`,
      { id: z.string().describe(`The ${resourceName} ID`) },
      async (args) => handleApiCall(() => client.delete(`${apiPath}/${args.id}`))
    );
  }
}

export interface NestedCrudConfig {
  /** Parent singular name, e.g., "task" */
  parentName: string;
  /** Parent API path, e.g., "/tasks" */
  parentApiPath: string;
  /** Child singular name, e.g., "comment" */
  childName: string;
  /** Child plural name, e.g., "comments" */
  childNamePlural: string;
  /** Child API path suffix, e.g., "/comments" */
  childApiPath: string;
  /** Zod shape for create params (excluding parent_id) */
  createShape: ZodRawShape;
  /** Zod shape for update params (excluding parent_id and id), if updates are supported */
  updateShape?: ZodRawShape;
  /** Description for tools */
  description: string;
  /** Whether to skip delete tool */
  skipDelete?: boolean;
  /** Whether to skip get single tool */
  skipGet?: boolean;
}

export function registerNestedCrudTools(
  server: McpServer,
  client: WrikeClient,
  config: NestedCrudConfig
): void {
  const {
    parentName,
    parentApiPath,
    childName,
    childNamePlural,
    childApiPath,
    createShape,
    updateShape,
    description,
    skipDelete,
    skipGet,
  } = config;

  const parentIdKey = `${parentName}_id`;
  const parentIdDesc = `The ${parentName} ID`;

  // CREATE
  server.tool(
    `wrike_create_${parentName}_${childName}`,
    `Create a ${description} for a ${parentName}`,
    {
      [parentIdKey]: z.string().describe(parentIdDesc),
      ...createShape,
    },
    async (args: Record<string, unknown>) => {
      const parentId = args[parentIdKey];
      const { [parentIdKey]: _, ...body } = args;
      return handleApiCall(() =>
        client.post(`${parentApiPath}/${parentId}${childApiPath}`, body)
      );
    }
  );

  // LIST
  server.tool(
    `wrike_list_${parentName}_${childNamePlural}`,
    `List ${description}s for a ${parentName}`,
    {
      [parentIdKey]: z.string().describe(parentIdDesc),
      ...paginationParams.shape,
    },
    async (args: Record<string, unknown>) => {
      const parentId = args[parentIdKey];
      const { [parentIdKey]: _, ...params } = args;
      return handleApiCall(() =>
        client.get(`${parentApiPath}/${parentId}${childApiPath}`, params)
      );
    }
  );

  // GET
  if (!skipGet) {
    server.tool(
      `wrike_get_${parentName}_${childName}`,
      `Get a specific ${description} for a ${parentName}`,
      {
        [parentIdKey]: z.string().describe(parentIdDesc),
        id: z.string().describe(`The ${childName} ID`),
      },
      async (args: Record<string, unknown>) => {
        const parentId = args[parentIdKey];
        return handleApiCall(() =>
          client.get(`${parentApiPath}/${parentId}${childApiPath}/${args.id}`)
        );
      }
    );
  }

  // UPDATE
  if (updateShape) {
    server.tool(
      `wrike_update_${parentName}_${childName}`,
      `Update a ${description} for a ${parentName}`,
      {
        [parentIdKey]: z.string().describe(parentIdDesc),
        id: z.string().describe(`The ${childName} ID`),
        ...updateShape,
      },
      async (args: Record<string, unknown>) => {
        const parentId = args[parentIdKey];
        const { [parentIdKey]: _, id, ...body } = args;
        return handleApiCall(() =>
          client.put(`${parentApiPath}/${parentId}${childApiPath}/${id}`, body)
        );
      }
    );
  }

  // DELETE
  if (!skipDelete) {
    server.tool(
      `wrike_delete_${parentName}_${childName}`,
      `Delete a ${description} for a ${parentName}`,
      {
        [parentIdKey]: z.string().describe(parentIdDesc),
        id: z.string().describe(`The ${childName} ID`),
      },
      async (args: Record<string, unknown>) => {
        const parentId = args[parentIdKey];
        return handleApiCall(() =>
          client.delete(`${parentApiPath}/${parentId}${childApiPath}/${args.id}`)
        );
      }
    );
  }
}
