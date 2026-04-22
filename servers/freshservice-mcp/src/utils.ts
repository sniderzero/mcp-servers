import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z, ZodRawShape } from "zod";
import { FreshServiceClient, FreshServiceApiError } from "./client.js";
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
    if (error instanceof FreshServiceApiError) {
      const parts = [`FreshService API Error (${error.statusCode}): ${error.message}`];
      if (error.errors) {
        for (const e of error.errors) {
          parts.push(`  - ${e.field}: ${e.message} (${e.code})`);
        }
      }
      return {
        content: [{ type: "text", text: parts.join("\n") }],
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
  /** Singular resource name for tool names, e.g., "ticket" */
  resourceName: string;
  /** Plural resource name for tool names, e.g., "tickets" */
  resourceNamePlural: string;
  /** API path prefix, e.g., "/tickets" */
  apiPath: string;
  /** JSON response key for single resource, e.g., "ticket" */
  responseKey: string;
  /** JSON response key for list, e.g., "tickets" */
  responsePluralKey: string;
  /** Zod shape for create params */
  createShape: ZodRawShape;
  /** Zod shape for update params (excluding id) */
  updateShape: ZodRawShape;
  /** Description prefix for tools */
  description: string;
  /** Whether this resource supports restore (PUT /{id}/restore) */
  supportsRestore?: boolean;
  /** Extra Zod shape fields for list params (merged with pagination) */
  listShape?: ZodRawShape;
  /** Whether to skip delete tool */
  skipDelete?: boolean;
}

export function registerCrudTools(
  server: McpServer,
  client: FreshServiceClient,
  config: CrudConfig
): void {
  const {
    resourceName,
    resourceNamePlural,
    apiPath,
    responseKey,
    responsePluralKey,
    createShape,
    updateShape,
    description,
    supportsRestore,
    listShape,
    skipDelete,
  } = config;

  // CREATE
  server.tool(
    `freshservice_create_${resourceName}`,
    `Create a new ${description}`,
    createShape,
    async (args) =>
      handleApiCall(() => client.post(`${apiPath}`, { [responseKey]: args }))
  );

  // GET
  server.tool(
    `freshservice_get_${resourceName}`,
    `Get a ${description} by ID`,
    { id: z.number().describe(`The ${resourceName} ID`) },
    async (args) => handleApiCall(() => client.get(`${apiPath}/${args.id}`))
  );

  // LIST
  const listSchemaShape: ZodRawShape = {
    ...paginationParams.shape,
    ...(listShape || {}),
  };
  server.tool(
    `freshservice_list_${resourceNamePlural}`,
    `List all ${description}s`,
    listSchemaShape,
    async (args) => {
      const { ...params } = args;
      return handleApiCall(() => client.get(`${apiPath}`, params));
    }
  );

  // UPDATE
  server.tool(
    `freshservice_update_${resourceName}`,
    `Update a ${description}`,
    {
      id: z.number().describe(`The ${resourceName} ID`),
      ...updateShape,
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() => client.put(`${apiPath}/${id}`, { [responseKey]: body }));
    }
  );

  // DELETE
  if (!skipDelete) {
    server.tool(
      `freshservice_delete_${resourceName}`,
      `Delete a ${description}`,
      { id: z.number().describe(`The ${resourceName} ID`) },
      async (args) => handleApiCall(() => client.delete(`${apiPath}/${args.id}`))
    );
  }

  // RESTORE
  if (supportsRestore) {
    server.tool(
      `freshservice_restore_${resourceName}`,
      `Restore a deleted ${description}`,
      { id: z.number().describe(`The ${resourceName} ID`) },
      async (args) =>
        handleApiCall(() => client.put(`${apiPath}/${args.id}/restore`))
    );
  }
}

export interface NestedCrudConfig {
  /** Parent singular name, e.g., "ticket" */
  parentName: string;
  /** Parent API path, e.g., "/tickets" */
  parentApiPath: string;
  /** Child singular name, e.g., "note" */
  childName: string;
  /** Child plural name, e.g., "notes" */
  childNamePlural: string;
  /** Child API path suffix, e.g., "/notes" */
  childApiPath: string;
  /** JSON response key for single child */
  responseKey: string;
  /** JSON response key for child list */
  responsePluralKey: string;
  /** Zod shape for create params (excluding parent_id) */
  createShape: ZodRawShape;
  /** Zod shape for update params (excluding parent_id and id), if updates are supported */
  updateShape?: ZodRawShape;
  /** Description for tools */
  description: string;
  /** Whether to skip delete tool */
  skipDelete?: boolean;
  /** Whether to skip the get single tool */
  skipGet?: boolean;
}

export function registerNestedCrudTools(
  server: McpServer,
  client: FreshServiceClient,
  config: NestedCrudConfig
): void {
  const {
    parentName,
    parentApiPath,
    childName,
    childNamePlural,
    childApiPath,
    responseKey,
    responsePluralKey,
    createShape,
    updateShape,
    description,
    skipDelete,
    skipGet,
  } = config;

  const parentIdDesc = `The ${parentName} ID`;

  // CREATE
  server.tool(
    `freshservice_create_${parentName}_${childName}`,
    `Create a ${description} for a ${parentName}`,
    {
      [`${parentName}_id`]: z.number().describe(parentIdDesc),
      ...createShape,
    },
    async (args: Record<string, unknown>) => {
      const parentId = args[`${parentName}_id`];
      const { [`${parentName}_id`]: _, ...body } = args;
      return handleApiCall(() =>
        client.post(`${parentApiPath}/${parentId}${childApiPath}`, body)
      );
    }
  );

  // LIST
  server.tool(
    `freshservice_list_${parentName}_${childNamePlural}`,
    `List ${description}s for a ${parentName}`,
    {
      [`${parentName}_id`]: z.number().describe(parentIdDesc),
      ...paginationParams.shape,
    },
    async (args: Record<string, unknown>) => {
      const parentId = args[`${parentName}_id`];
      const { [`${parentName}_id`]: _, ...params } = args;
      return handleApiCall(() =>
        client.get(`${parentApiPath}/${parentId}${childApiPath}`, params)
      );
    }
  );

  // GET
  if (!skipGet) {
    server.tool(
      `freshservice_get_${parentName}_${childName}`,
      `Get a specific ${description} for a ${parentName}`,
      {
        [`${parentName}_id`]: z.number().describe(parentIdDesc),
        id: z.number().describe(`The ${childName} ID`),
      },
      async (args: Record<string, unknown>) => {
        const parentId = args[`${parentName}_id`];
        return handleApiCall(() =>
          client.get(`${parentApiPath}/${parentId}${childApiPath}/${args.id}`)
        );
      }
    );
  }

  // UPDATE
  if (updateShape) {
    server.tool(
      `freshservice_update_${parentName}_${childName}`,
      `Update a ${description} for a ${parentName}`,
      {
        [`${parentName}_id`]: z.number().describe(parentIdDesc),
        id: z.number().describe(`The ${childName} ID`),
        ...updateShape,
      },
      async (args: Record<string, unknown>) => {
        const parentId = args[`${parentName}_id`];
        const { [`${parentName}_id`]: _, id, ...body } = args;
        return handleApiCall(() =>
          client.put(`${parentApiPath}/${parentId}${childApiPath}/${id}`, body)
        );
      }
    );
  }

  // DELETE
  if (!skipDelete) {
    server.tool(
      `freshservice_delete_${parentName}_${childName}`,
      `Delete a ${description} for a ${parentName}`,
      {
        [`${parentName}_id`]: z.number().describe(parentIdDesc),
        id: z.number().describe(`The ${childName} ID`),
      },
      async (args: Record<string, unknown>) => {
        const parentId = args[`${parentName}_id`];
        return handleApiCall(() =>
          client.delete(`${parentApiPath}/${parentId}${childApiPath}/${args.id}`)
        );
      }
    );
  }
}
