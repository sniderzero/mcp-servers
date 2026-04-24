import type { TokenProvider } from "../auth/types.js";
import type { ToolDef } from "./drives/index.js";
import { driveTools } from "./drives/index.js";
import { fileTools } from "./files/index.js";
import { siteTools } from "./sites/index.js";
import { listTools } from "./lists/index.js";
import { sharingTools } from "./sharing/index.js";
import { pageTools } from "./pages/index.js";
import { authTools } from "./auth/index.js";

export const ALL_TOOLS: ToolDef[] = [
  ...authTools,
  ...driveTools,
  ...fileTools,
  ...siteTools,
  ...listTools,
  ...sharingTools,
  ...pageTools,
];

export const ALL_TOOL_DEFINITIONS = ALL_TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  inputSchema: {
    type: "object" as const,
    properties: Object.fromEntries(
      Object.entries(t.schema).map(([k, v]) => [k, zodToJsonSchema(v)])
    ),
    required: Object.entries(t.schema)
      .filter(([, v]) => !v.isOptional())
      .map(([k]) => k),
  },
}));

function zodToJsonSchema(schema: import("zod").ZodTypeAny): Record<string, unknown> {
  const def = schema._def;
  const base: Record<string, unknown> = {};

  if (def.description) base.description = def.description;

  const typeName: string = def.typeName;

  if (typeName === "ZodString") return { type: "string", ...base };
  if (typeName === "ZodNumber") return { type: "number", ...base };
  if (typeName === "ZodBoolean") return { type: "boolean", ...base };
  if (typeName === "ZodRecord") return { type: "object", ...base };
  if (typeName === "ZodEnum") return { type: "string", enum: def.values, ...base };
  if (typeName === "ZodOptional") return zodToJsonSchema(def.innerType);

  return { type: "string", ...base };
}

const toolMap = new Map<string, ToolDef>(ALL_TOOLS.map((t) => [t.name, t]));

export function getToolHandler(
  name: string
): ((args: Record<string, unknown>, provider: TokenProvider) => Promise<unknown>) | undefined {
  return toolMap.get(name)?.handler;
}
