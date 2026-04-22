import { z } from "zod";
import { graphFetch } from "../../graph/client.js";
import type { ToolDef } from "../drives/index.js";

export const sharingTools: ToolDef[] = [
  {
    name: "m365_sp_create_sharing_link",
    description: "Create a sharing link for a file or folder",
    schema: {
      driveId: z.string().describe("The drive ID"),
      itemId: z.string().describe("The item ID"),
      type: z.enum(["view", "edit"]).describe("Link type: 'view' or 'edit'"),
      scope: z.enum(["anonymous", "organization"]).describe("Link scope: 'anonymous' or 'organization'"),
    },
    handler: async (args, provider) => {
      const { driveId, itemId, type, scope } = args as {
        driveId: string; itemId: string; type: string; scope: string;
      };
      return graphFetch(
        `/drives/${driveId}/items/${itemId}/createLink`,
        provider,
        { method: "POST", body: JSON.stringify({ type, scope }) }
      );
    },
  },
  {
    name: "m365_sp_list_permissions",
    description: "List permissions set on a file or folder",
    schema: {
      driveId: z.string().describe("The drive ID"),
      itemId: z.string().describe("The item ID"),
    },
    handler: async (args, provider) => {
      const { driveId, itemId } = args as { driveId: string; itemId: string };
      return graphFetch(`/drives/${driveId}/items/${itemId}/permissions`, provider);
    },
  },
];
