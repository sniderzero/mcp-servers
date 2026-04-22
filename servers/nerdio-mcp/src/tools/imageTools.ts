import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { NerdioClient } from "../api/client.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const IMAGE_TOOL_DEFINITIONS = [
  {
    name: "nerdio_list_desktop_images",
    description: "List all Nerdio desktop images (VMs used as image sources).",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "nerdio_list_images",
    description: "List all available images (marketplace, custom, compute gallery). Optionally filter by type.",
    inputSchema: {
      type: "object" as const,
      properties: {
        imageType: {
          type: "string",
          enum: ["MarketplaceImage", "CustomImage", "ComputeGalleryImage"],
          description: "Optional filter by image type.",
        },
      },
    },
  },
  {
    name: "nerdio_set_as_image",
    description: "Power off a desktop image VM and set it as the image. Returns a job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        name: { type: "string", description: "Desktop image VM name." },
        config: {
          type: "object",
          description: "SetAsImagePayload (changelog, powerOnVm, scriptedActions, galleryImage, etc.).",
        },
      },
      required: ["subscriptionId", "resourceGroup", "name"],
    },
  },
  {
    name: "nerdio_create_image_from_library",
    description: "Create a new desktop image from an Azure marketplace/gallery image. Returns a job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        config: {
          type: "object",
          description: "CreateImageFromLibraryRequest body. See Nerdio API docs for full schema.",
        },
      },
      required: ["config"],
    },
  },
];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const ListImagesSchema = z.object({
  imageType: z.enum(["MarketplaceImage", "CustomImage", "ComputeGalleryImage"]).optional(),
});

const SetAsImageSchema = z.object({
  subscriptionId: z.string(),
  resourceGroup: z.string(),
  name: z.string(),
  config: z.record(z.unknown()).optional(),
});

const CreateFromLibrarySchema = z.object({
  config: z.record(z.unknown()),
});

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleListDesktopImages(_args: unknown, client: NerdioClient): Promise<unknown> {
  return client.get("/api/v1/desktop-image");
}

export async function handleListImages(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = ListImagesSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const query = parsed.data.imageType ? `?imageType=${parsed.data.imageType}` : "";
  return client.get(`/api/v1/image${query}`);
}

export async function handleSetAsImage(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = SetAsImageSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const { subscriptionId, resourceGroup, name, config } = parsed.data;
  return client.post(
    `/api/v1/desktop-image/${subscriptionId}/${resourceGroup}/${name}/set-as-image`,
    { jobPayload: config ?? {}, failurePolicy: { restart: true, cleanup: true } },
  );
}

export async function handleCreateImageFromLibrary(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = CreateFromLibrarySchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post("/api/v1/desktop-image/create-from-library", parsed.data.config);
}
