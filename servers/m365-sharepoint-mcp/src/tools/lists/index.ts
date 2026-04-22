import { z } from "zod";
import { graphFetch } from "../../graph/client.js";
import type { ToolDef } from "../drives/index.js";

export const listTools: ToolDef[] = [
  {
    name: "m365_sp_list_lists",
    description: "List all SharePoint lists in a site",
    schema: {
      siteId: z.string().describe("The site ID"),
    },
    handler: async (args, provider) => {
      const { siteId } = args as { siteId: string };
      return graphFetch(`/sites/${siteId}/lists`, provider);
    },
  },
  {
    name: "m365_sp_get_list",
    description: "Get a specific SharePoint list by its ID",
    schema: {
      siteId: z.string().describe("The site ID"),
      listId: z.string().describe("The list ID"),
    },
    handler: async (args, provider) => {
      const { siteId, listId } = args as { siteId: string; listId: string };
      return graphFetch(`/sites/${siteId}/lists/${listId}`, provider);
    },
  },
  {
    name: "m365_sp_list_list_items",
    description: "List items in a SharePoint list (expands fields by default)",
    schema: {
      siteId: z.string().describe("The site ID"),
      listId: z.string().describe("The list ID"),
      top: z.number().optional().describe("Max number of results (default 50)"),
      expand: z.string().optional().describe("OData $expand (default: fields)"),
    },
    handler: async (args, provider) => {
      const { siteId, listId, top, expand } = args as {
        siteId: string; listId: string; top?: number; expand?: string;
      };
      const params = new URLSearchParams();
      params.set("$expand", expand ?? "fields");
      if (top) params.set("$top", String(top));
      return graphFetch(`/sites/${siteId}/lists/${listId}/items?${params}`, provider);
    },
  },
  {
    name: "m365_sp_create_list_item",
    description: "Create a new item in a SharePoint list",
    schema: {
      siteId: z.string().describe("The site ID"),
      listId: z.string().describe("The list ID"),
      fields: z.record(z.unknown()).describe("Field values as key-value pairs matching list column internal names"),
    },
    handler: async (args, provider) => {
      const { siteId, listId, fields } = args as {
        siteId: string; listId: string; fields: Record<string, unknown>;
      };
      return graphFetch(
        `/sites/${siteId}/lists/${listId}/items`,
        provider,
        { method: "POST", body: JSON.stringify({ fields }) }
      );
    },
  },
  {
    name: "m365_sp_update_list_item",
    description: "Update an existing item in a SharePoint list",
    schema: {
      siteId: z.string().describe("The site ID"),
      listId: z.string().describe("The list ID"),
      itemId: z.string().describe("The list item ID"),
      fields: z.record(z.unknown()).describe("Field values to update as key-value pairs"),
    },
    handler: async (args, provider) => {
      const { siteId, listId, itemId, fields } = args as {
        siteId: string; listId: string; itemId: string; fields: Record<string, unknown>;
      };
      return graphFetch(
        `/sites/${siteId}/lists/${listId}/items/${itemId}/fields`,
        provider,
        { method: "PATCH", body: JSON.stringify(fields) }
      );
    },
  },
];
