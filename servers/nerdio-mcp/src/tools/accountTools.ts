import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { NerdioClient } from "../api/client.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const ACCOUNT_TOOL_DEFINITIONS = [
  {
    name: "nerdio_get_deployment_info",
    description: "Get current Nerdio Manager installation/deployment info (version, edition, etc.).",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "nerdio_list_resource_groups",
    description: "List Azure resource groups linked to Nerdio.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "nerdio_list_networks",
    description: "List all virtual networks linked to Nerdio.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "nerdio_list_ad_configs",
    description: "List Active Directory configurations.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "nerdio_test_api",
    description: "Test the Nerdio REST API connection.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleGetDeploymentInfo(_args: unknown, client: NerdioClient): Promise<unknown> {
  return client.get("/api/v1/deployment/current");
}

export async function handleListResourceGroups(_args: unknown, client: NerdioClient): Promise<unknown> {
  return client.get("/api/v1/resourcegroup");
}

export async function handleListNetworks(_args: unknown, client: NerdioClient): Promise<unknown> {
  return client.get("/api/v1/networks");
}

export async function handleListAdConfigs(_args: unknown, client: NerdioClient): Promise<unknown> {
  return client.get("/api/v1/ad/config");
}

export async function handleTestApi(_args: unknown, client: NerdioClient): Promise<unknown> {
  return client.get("/api/v1/test");
}
