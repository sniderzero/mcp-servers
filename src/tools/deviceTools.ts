import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ControlUpClient } from "../api/client.js";

export const DEVICE_TOOL_DEFINITIONS = [
  {
    name: "controlup_list_devices",
    description: "List all managed devices in ControlUp Edge DX. Supports filtering and sorting.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "integer", description: "Page number (default 1)." },
        limit: { type: "integer", description: "Items per page." },
        filterField: { type: "string", description: "Field name to filter on." },
        filterType: { type: "string", enum: ["<", "<=", "=", "!=", ">=", ">", "like", "boolean", "wildcard"], description: "Filter comparison type." },
        filterValue: { type: "string", description: "Value to filter by." },
        sortField: { type: "string", description: "Field to sort by." },
        sortDir: { type: "string", enum: ["asc", "desc"], description: "Sort direction." },
      },
    },
  },
  {
    name: "controlup_list_device_tags",
    description: "List all device tags in ControlUp Edge DX.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "controlup_update_device_tags",
    description: "Update tags on devices.",
    inputSchema: {
      type: "object" as const,
      properties: {
        body: { type: "object", description: "Tag update payload. See ControlUp API docs." },
      },
      required: ["body"],
    },
  },
  {
    name: "controlup_list_device_groups",
    description: "List all device groups in ControlUp Edge DX.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "controlup_set_device_group",
    description: "Set the group for devices.",
    inputSchema: {
      type: "object" as const,
      properties: {
        body: { type: "object", description: "Device group assignment payload." },
      },
      required: ["body"],
    },
  },
  {
    name: "controlup_run_device_action",
    description: "Perform an action on one or multiple devices.",
    inputSchema: {
      type: "object" as const,
      properties: {
        body: { type: "object", description: "Action payload (action type, device IDs, parameters)." },
      },
      required: ["body"],
    },
  },
];

const ListDevicesSchema = z.object({
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
  filterField: z.string().optional(),
  filterType: z.string().optional(),
  filterValue: z.string().optional(),
  sortField: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

const BodySchema = z.object({ body: z.record(z.unknown()) });

export async function handleListDevices(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = ListDevicesSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const params = new URLSearchParams();
  if (parsed.data.page) params.set("_page", String(parsed.data.page));
  if (parsed.data.limit) params.set("_limit", String(parsed.data.limit));
  if (parsed.data.filterField) {
    params.set("filters[0][field]", parsed.data.filterField);
    if (parsed.data.filterType) params.set("filters[0][type]", parsed.data.filterType);
    if (parsed.data.filterValue) params.set("filters[0][value]", parsed.data.filterValue);
  }
  if (parsed.data.sortField) {
    params.set("sorters[0][field]", parsed.data.sortField);
    if (parsed.data.sortDir) params.set("sorters[0][dir]", parsed.data.sortDir);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return client.get(`/edge/api/devices${query}`);
}

export async function handleListDeviceTags(_args: unknown, client: ControlUpClient): Promise<unknown> {
  return client.get("/edge/api/devices/tags");
}

export async function handleUpdateDeviceTags(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = BodySchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post("/edge/api/devices/tags", parsed.data.body);
}

export async function handleListDeviceGroups(_args: unknown, client: ControlUpClient): Promise<unknown> {
  return client.get("/edge/api/devices/groups");
}

export async function handleSetDeviceGroup(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = BodySchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post("/edge/api/devices/groups", parsed.data.body);
}

export async function handleRunDeviceAction(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = BodySchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post("/edge/api/devices/action", parsed.data.body);
}
