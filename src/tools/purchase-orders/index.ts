import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerCrudTools } from "../../utils.js";

const purchaseItemSchema = z.object({
  item_type: z
    .number()
    .optional()
    .describe("Type of item: 1=Product, 2=Software License"),
  item_id: z.number().optional().describe("ID of the product or software"),
  item_name: z.string().optional().describe("Name of the item"),
  description: z.string().optional().describe("Description of the item"),
  cost: z.number().optional().describe("Cost per unit"),
  quantity: z.number().optional().describe("Quantity ordered"),
  tax_percentage: z.number().optional().describe("Tax percentage for the item"),
});

export function registerPurchaseOrderTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerCrudTools(server, client, {
    resourceName: "purchase_order",
    resourceNamePlural: "purchase_orders",
    apiPath: "/purchase_orders",
    responseKey: "purchase_order",
    responsePluralKey: "purchase_orders",
    createShape: {
      vendor_id: z.number().describe("ID of the vendor for this purchase order"),
      name: z.string().describe("Name/title of the purchase order"),
      po_number: z
        .string()
        .optional()
        .describe("Unique purchase order number"),
      expected_delivery_date: z
        .string()
        .optional()
        .describe("Expected delivery date (YYYY-MM-DD format)"),
      purchase_items: z
        .array(purchaseItemSchema)
        .optional()
        .describe("Array of items in the purchase order"),
      department_id: z
        .number()
        .optional()
        .describe("ID of the department placing the order"),
      discount_percentage: z
        .number()
        .optional()
        .describe("Discount percentage for the order"),
      shipping_cost: z
        .number()
        .optional()
        .describe("Shipping cost for the order"),
      currency_code: z
        .string()
        .optional()
        .describe("Currency code (e.g., USD, EUR)"),
      custom_fields: z
        .record(z.unknown())
        .optional()
        .describe("Custom field key-value pairs"),
    },
    updateShape: {
      vendor_id: z
        .number()
        .optional()
        .describe("ID of the vendor for this purchase order"),
      name: z.string().optional().describe("Name/title of the purchase order"),
      po_number: z
        .string()
        .optional()
        .describe("Unique purchase order number"),
      expected_delivery_date: z
        .string()
        .optional()
        .describe("Expected delivery date (YYYY-MM-DD format)"),
      purchase_items: z
        .array(purchaseItemSchema)
        .optional()
        .describe("Array of items in the purchase order"),
      department_id: z
        .number()
        .optional()
        .describe("ID of the department placing the order"),
      discount_percentage: z
        .number()
        .optional()
        .describe("Discount percentage for the order"),
      shipping_cost: z
        .number()
        .optional()
        .describe("Shipping cost for the order"),
      currency_code: z
        .string()
        .optional()
        .describe("Currency code (e.g., USD, EUR)"),
      custom_fields: z
        .record(z.unknown())
        .optional()
        .describe("Custom field key-value pairs"),
    },
    description: "purchase order",
  });
}
