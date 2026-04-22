import { z } from "zod";
import { graphFetch } from "../../graph/client.js";
import type { TokenProvider } from "../../auth/types.js";

export type ToolDef = {
  name: string;
  description: string;
  schema: Record<string, z.ZodTypeAny>;
  handler: (args: Record<string, unknown>, provider: TokenProvider) => Promise<unknown>;
};

export const driveTools: ToolDef[] = [
  {
    name: "m365_sp_list_drives",
    description: "List all OneDrive drives available to the current user",
    schema: {},
    handler: async (_args, provider) => {
      return graphFetch("/me/drives", provider);
    },
  },
  {
    name: "m365_sp_get_drive",
    description: "Get a specific drive by its ID",
    schema: {
      driveId: z.string().describe("The drive ID"),
    },
    handler: async (args, provider) => {
      const { driveId } = args as { driveId: string };
      return graphFetch(`/drives/${driveId}`, provider);
    },
  },
  {
    name: "m365_sp_get_my_drive",
    description: "Get the current user's default OneDrive",
    schema: {},
    handler: async (_args, provider) => {
      return graphFetch("/me/drive", provider);
    },
  },
];
