import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ControlUpClient } from "../api/client.js";

export const MACHINE_TOOL_DEFINITIONS = [
  {
    name: "controlup_list_machines",
    description: "List VDI/DaaS machines. Supports pagination, search, and filtering.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "integer", description: "Page number (default 1)." },
        limit: { type: "integer", description: "Items per page (default 50, max 500)." },
        sort: { type: "string", description: "Sort field (objectGuid, name, fqdn, netBiosName, siteId)." },
        order: { type: "string", enum: ["Asc", "Desc"], description: "Sort direction." },
        search: { type: "string", description: "Case-insensitive search on fqdn and description." },
        folderPath: { type: "string", description: "Filter by exact folder path." },
        site: { type: "string", description: "Filter by monitor site name." },
        includeDetails: { type: "boolean", description: "Include agent/load balancing/VDI status details." },
      },
    },
  },
  {
    name: "controlup_get_machine",
    description: "Get details of a specific VDI/DaaS machine.",
    inputSchema: {
      type: "object" as const,
      properties: {
        machineId: { type: "string", description: "Machine ID (objectGuid)." },
      },
      required: ["machineId"],
    },
  },
  {
    name: "controlup_upsert_machines",
    description: "Create or update VDI/DaaS machines.",
    inputSchema: {
      type: "object" as const,
      properties: {
        body: { type: "object", description: "Machine upsert payload (array of machine objects)." },
      },
      required: ["body"],
    },
  },
  {
    name: "controlup_delete_machines",
    description: "Delete VDI/DaaS machines.",
    inputSchema: {
      type: "object" as const,
      properties: {
        body: { type: "object", description: "Machine deletion payload (array of machine IDs)." },
      },
      required: ["body"],
    },
  },
];

const ListMachinesSchema = z.object({
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
  sort: z.string().optional(),
  order: z.enum(["Asc", "Desc"]).optional(),
  search: z.string().optional(),
  folderPath: z.string().optional(),
  site: z.string().optional(),
  includeDetails: z.boolean().optional(),
});

const MachineIdSchema = z.object({ machineId: z.string() });
const BodySchema = z.object({ body: z.record(z.unknown()) });

export async function handleListMachines(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = ListMachinesSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const params = new URLSearchParams();
  if (parsed.data.page) params.set("page", String(parsed.data.page));
  if (parsed.data.limit) params.set("limit", String(parsed.data.limit));
  if (parsed.data.sort) params.set("sort", parsed.data.sort);
  if (parsed.data.order) params.set("order", parsed.data.order);
  if (parsed.data.search) params.set("search", parsed.data.search);
  if (parsed.data.folderPath) params.set("folderPath", parsed.data.folderPath);
  if (parsed.data.site) params.set("site", parsed.data.site);
  if (parsed.data.includeDetails !== undefined) params.set("includeDetails", String(parsed.data.includeDetails));
  const query = params.toString() ? `?${params.toString()}` : "";
  return client.get(`/vdi/config/v1/machines${query}`);
}

export async function handleGetMachine(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = MachineIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/vdi/config/v1/machines/${parsed.data.machineId}`);
}

export async function handleUpsertMachines(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = BodySchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post("/vdi/config/v1/machines", parsed.data.body);
}

export async function handleDeleteMachines(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = BodySchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.delete("/vdi/config/v1/machines", parsed.data.body);
}
