import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerCrudTools } from "../../utils.js";

export function registerLocationTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  const createShape = {
    name: z.string().describe("Name of the location"),
    address: z.string().optional().describe("Street address of the location"),
    city: z.string().optional().describe("City of the location"),
    state: z.string().optional().describe("State of the location"),
    country: z.string().optional().describe("Country of the location"),
    zipcode: z.string().optional().describe("Zip/postal code of the location"),
    contact_name: z.string().optional().describe("Name of the contact person at this location"),
    email: z.string().optional().describe("Email address of the contact person"),
    phone: z.string().optional().describe("Phone number of the contact person"),
    parent_location_id: z.number().optional().describe("ID of the parent location for hierarchical structuring"),
  };

  const updateShape = {
    name: z.string().optional().describe("Name of the location"),
    address: z.string().optional().describe("Street address of the location"),
    city: z.string().optional().describe("City of the location"),
    state: z.string().optional().describe("State of the location"),
    country: z.string().optional().describe("Country of the location"),
    zipcode: z.string().optional().describe("Zip/postal code of the location"),
    contact_name: z.string().optional().describe("Name of the contact person at this location"),
    email: z.string().optional().describe("Email address of the contact person"),
    phone: z.string().optional().describe("Phone number of the contact person"),
    parent_location_id: z.number().optional().describe("ID of the parent location for hierarchical structuring"),
  };

  registerCrudTools(server, client, {
    resourceName: "location",
    resourceNamePlural: "locations",
    apiPath: "/locations",
    responseKey: "location",
    responsePluralKey: "locations",
    createShape,
    updateShape,
    description: "location",
  });
}
