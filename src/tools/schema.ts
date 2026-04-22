import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { entitySchemas } from "../schemas/entity-schemas.js";
import { ok, err } from "../utils.js";

const entityTypes = Object.keys(entitySchemas) as [string, ...string[]];

export function registerSchemaTool(server: McpServer): void {
  server.tool(
    "m365_schema",
    "Get the properties and capabilities of a Microsoft Graph entity type. " +
      "Use this to understand what fields are available for $select, $filter, $orderby, " +
      "and $search when building Graph API queries with m365_read or m365_write. " +
      "Available types: " + entityTypes.join(", "),
    {
      entity_type: z
        .enum(entityTypes)
        .describe("The Graph entity type to look up"),
    },
    { readOnlyHint: true },
    async ({ entity_type }) => {
      const schema = entitySchemas[entity_type];
      if (!schema) {
        return err(`Unknown entity type: ${entity_type}. Available: ${entityTypes.join(", ")}`);
      }
      return ok({ entity_type, ...schema });
    }
  );
}
