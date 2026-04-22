import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  getPlanBuckets,
  createBucket,
  updateBucket,
  deleteBucket,
} from "../graph/buckets.js";
import type { TokenProvider } from "../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const BUCKET_TOOL_DEFINITIONS = [
  {
    name: "list_buckets",
    description: "List all buckets in a Planner plan.",
    inputSchema: {
      type: "object" as const,
      properties: {
        planId: { type: "string" },
      },
      required: ["planId"],
    },
  },
  {
    name: "create_bucket",
    description: "Create a new bucket in a Planner plan.",
    inputSchema: {
      type: "object" as const,
      properties: {
        planId: { type: "string" },
        name: { type: "string" },
        orderHint: {
          type: "string",
          description: "Optional ordering hint. Leave blank to place at end.",
        },
      },
      required: ["planId", "name"],
    },
  },
  {
    name: "update_bucket",
    description: "Rename an existing Planner bucket.",
    inputSchema: {
      type: "object" as const,
      properties: {
        bucketId: { type: "string" },
        name: { type: "string" },
      },
      required: ["bucketId", "name"],
    },
  },
  {
    name: "delete_bucket",
    description: "Delete a Planner bucket. The bucket must be empty of tasks first.",
    inputSchema: {
      type: "object" as const,
      properties: {
        bucketId: { type: "string" },
      },
      required: ["bucketId"],
    },
  },
];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const ListBucketsSchema = z.object({ planId: z.string().min(1) });
const CreateBucketSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1),
  orderHint: z.string().optional(),
});
const UpdateBucketSchema = z.object({
  bucketId: z.string().min(1),
  name: z.string().min(1),
});
const DeleteBucketSchema = z.object({ bucketId: z.string().min(1) });

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleListBuckets(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = ListBucketsSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return getPlanBuckets(parsed.data.planId, provider);
}

export async function handleCreateBucket(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = CreateBucketSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return createBucket(
    parsed.data.planId,
    parsed.data.name,
    provider,
    parsed.data.orderHint
  );
}

export async function handleUpdateBucket(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = UpdateBucketSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  await updateBucket(parsed.data.bucketId, parsed.data.name, provider);
  return { success: true };
}

export async function handleDeleteBucket(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = DeleteBucketSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  await deleteBucket(parsed.data.bucketId, provider);
  return { success: true };
}
