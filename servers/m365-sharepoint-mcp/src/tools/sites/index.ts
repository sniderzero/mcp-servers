import { z } from "zod";
import { graphFetch } from "../../graph/client.js";
import type { ToolDef } from "../drives/index.js";

export const siteTools: ToolDef[] = [
  {
    name: "m365_sp_get_site",
    description: "Get a SharePoint site by its site ID",
    schema: {
      siteId: z.string().describe("The site ID (e.g. contoso.sharepoint.com,guid,guid)"),
    },
    handler: async (args, provider) => {
      const { siteId } = args as { siteId: string };
      return graphFetch(`/sites/${siteId}`, provider);
    },
  },
  {
    name: "m365_sp_get_site_by_url",
    description: "Get a SharePoint site by hostname and server-relative path",
    schema: {
      hostname: z.string().describe("The SharePoint hostname (e.g. contoso.sharepoint.com)"),
      path: z.string().describe("The server-relative path (e.g. sites/marketing)"),
    },
    handler: async (args, provider) => {
      const { hostname, path } = args as { hostname: string; path: string };
      return graphFetch(`/sites/${hostname}:/${path}`, provider);
    },
  },
  {
    name: "m365_sp_list_subsites",
    description: "List subsites of a SharePoint site",
    schema: {
      siteId: z.string().describe("The site ID"),
    },
    handler: async (args, provider) => {
      const { siteId } = args as { siteId: string };
      return graphFetch(`/sites/${siteId}/sites`, provider);
    },
  },
  {
    name: "m365_sp_list_followed_sites",
    description: "List SharePoint sites the current user is following",
    schema: {},
    handler: async (_args, provider) => {
      return graphFetch("/me/followedSites", provider);
    },
  },
];
