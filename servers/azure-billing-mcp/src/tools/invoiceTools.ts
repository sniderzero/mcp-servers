import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { AzureClient } from "../api/client.js";

export const INVOICE_TOOL_DEFINITIONS = [
  {
    name: "azure_billing_list_billing_accounts",
    description: "List all billing accounts accessible to the authenticated user. Requires 'Billing Account Reader' role. Returns empty if you lack permissions.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "azure_billing_list_invoices",
    description: "List invoices for a billing account.",
    inputSchema: {
      type: "object" as const,
      properties: {
        billingAccountName: { type: "string", description: "Billing account name/ID." },
      },
      required: ["billingAccountName"],
    },
  },
  {
    name: "azure_billing_get_invoice",
    description: "Get details of a specific invoice.",
    inputSchema: {
      type: "object" as const,
      properties: {
        billingAccountName: { type: "string", description: "Billing account name/ID." },
        invoiceName: { type: "string", description: "Invoice name." },
      },
      required: ["billingAccountName", "invoiceName"],
    },
  },
];

const BillingAccountSchema = z.object({ billingAccountName: z.string() });
const InvoiceSchema = z.object({ billingAccountName: z.string(), invoiceName: z.string() });

export async function handleListBillingAccounts(_args: unknown, client: AzureClient): Promise<unknown> {
  return client.get("/providers/Microsoft.Billing/billingAccounts?api-version=2024-04-01");
}

export async function handleListInvoices(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = BillingAccountSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/providers/Microsoft.Billing/billingAccounts/${parsed.data.billingAccountName}/invoices?api-version=2024-04-01`);
}

export async function handleGetInvoice(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = InvoiceSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/providers/Microsoft.Billing/billingAccounts/${parsed.data.billingAccountName}/invoices/${parsed.data.invoiceName}?api-version=2024-04-01`);
}
