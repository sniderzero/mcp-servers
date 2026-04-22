import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerCustomObjectTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // LIST CUSTOM OBJECTS
  server.tool(
    "freshservice_list_custom_objects",
    "List all custom objects",
    {
      ...paginationParams.shape,
    },
    async (args) => handleApiCall(() => client.get("/custom_objects", args))
  );

  // GET CUSTOM OBJECT
  server.tool(
    "freshservice_get_custom_object",
    "Get a custom object by ID",
    {
      id: z.number().describe("The custom object ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/custom_objects/${args.id}`))
  );

  // CREATE CUSTOM OBJECT RECORD
  server.tool(
    "freshservice_create_custom_object_record",
    "Create a new record in a custom object",
    {
      custom_object_id: z.number().describe("The custom object ID"),
      data: z.record(z.unknown()).describe("Key-value data for the custom object record"),
      version: z.number().optional().describe("Version number for optimistic locking"),
    },
    async (args) => {
      const { custom_object_id, ...body } = args;
      return handleApiCall(() =>
        client.post(`/custom_objects/${custom_object_id}/records`, { record: body })
      );
    }
  );

  // LIST CUSTOM OBJECT RECORDS
  server.tool(
    "freshservice_list_custom_object_records",
    "List all records in a custom object",
    {
      custom_object_id: z.number().describe("The custom object ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { custom_object_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/custom_objects/${custom_object_id}/records`, params)
      );
    }
  );

  // GET CUSTOM OBJECT RECORD
  server.tool(
    "freshservice_get_custom_object_record",
    "Get a specific record from a custom object",
    {
      custom_object_id: z.number().describe("The custom object ID"),
      record_id: z.number().describe("The record ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.get(`/custom_objects/${args.custom_object_id}/records/${args.record_id}`)
      )
  );

  // UPDATE CUSTOM OBJECT RECORD
  server.tool(
    "freshservice_update_custom_object_record",
    "Update a record in a custom object",
    {
      custom_object_id: z.number().describe("The custom object ID"),
      record_id: z.number().describe("The record ID"),
      data: z.record(z.unknown()).optional().describe("Key-value data to update"),
      version: z.number().optional().describe("Version number for optimistic locking"),
    },
    async (args) => {
      const { custom_object_id, record_id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/custom_objects/${custom_object_id}/records/${record_id}`, { record: body })
      );
    }
  );

  // DELETE CUSTOM OBJECT RECORD
  server.tool(
    "freshservice_delete_custom_object_record",
    "Delete a record from a custom object",
    {
      custom_object_id: z.number().describe("The custom object ID"),
      record_id: z.number().describe("The record ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.delete(`/custom_objects/${args.custom_object_id}/records/${args.record_id}`)
      )
  );
}
