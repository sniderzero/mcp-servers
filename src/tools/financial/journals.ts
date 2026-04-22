import {
  getJournals,
  getPayments,
  submitAccountingJournal,
} from "../../soap/operations/financialManagement.js";
import { normalizeError } from "../../utils/errorHandler.js";
import type { WorkdayContext } from "../index.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const JOURNALS_TOOL_DEFINITIONS = [
  {
    name: "workday_get_journals",
    description:
      "Retrieve Workday accounting journals. Filter by company (Organization_Reference_ID) and accounting date range.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (1-based)." },
        count: { type: "number", description: "Results per page (max 999)." },
        company_id: {
          type: "string",
          description: "Filter by company Organization_Reference_ID (e.g. APS_OpCo).",
        },
        from_date: {
          type: "string",
          description: "Accounting date on or after (YYYY-MM-DD).",
        },
        to_date: {
          type: "string",
          description: "Accounting date on or before (YYYY-MM-DD).",
        },
        journal_number: {
          type: "string",
          description: "Filter by exact journal number (e.g. JE-2026-37127).",
        },
      },
      required: [],
    },
  },
  {
    name: "workday_get_payments",
    description:
      "Retrieve Workday payments. Filter by date range.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (1-based)." },
        count: { type: "number", description: "Results per page (max 999)." },
        start_date: {
          type: "string",
          description: "Start date filter (YYYY-MM-DD).",
        },
        end_date: {
          type: "string",
          description: "End date filter (YYYY-MM-DD).",
        },
      },
      required: [],
    },
  },
  {
    name: "workday_create_journal",
    description:
      "Submit a new accounting journal entry in Workday. Each line must have either a debit or credit amount.",
    inputSchema: {
      type: "object" as const,
      properties: {
        accounting_date: {
          type: "string",
          description: "Journal accounting date (YYYY-MM-DD).",
        },
        company_id: {
          type: "string",
          description: "Workday company WID or reference ID.",
        },
        currency_code: {
          type: "string",
          description: "ISO 4217 currency code (e.g. USD).",
        },
        memo: { type: "string", description: "Optional journal memo." },
        lines: {
          type: "array",
          description: "Journal entry lines. Each line needs a ledger account and either debit or credit amount.",
          items: {
            type: "object",
            properties: {
              ledger_account_id: {
                type: "string",
                description: "Ledger account WID or reference ID.",
              },
              debit_amount: { type: "number", description: "Debit amount." },
              credit_amount: { type: "number", description: "Credit amount." },
              cost_center_id: {
                type: "string",
                description: "Optional cost center WID or reference ID.",
              },
              memo: { type: "string", description: "Optional line memo." },
            },
          },
        },
      },
      required: ["accounting_date", "company_id", "currency_code", "lines"],
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleGetJournals(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { page, count, company_id, from_date, to_date, journal_number } = args as {
    page?: number;
    count?: number;
    company_id?: string;
    from_date?: string;
    to_date?: string;
    journal_number?: string;
  };

  // Workday Get_Journals requires Accounting_From_Date AND Accounting_To_Date
  // (or Updated_From/To). Default to the past 2 years when the caller didn't
  // specify dates so the common "find this journal" case works.
  const defaultFrom = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 2);
    return d.toISOString().slice(0, 10);
  })();
  const defaultTo = new Date().toISOString().slice(0, 10);

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      getJournals,
      {
        Response_Filter: { Page: page, Count: count },
        Request_Criteria: {
          Organization_Reference: company_id
            ? [{
                ID: [{ $value:company_id, attributes: { "wd:type": "Organization_Reference_ID" } }],
              }]
            : undefined,
          Accounting_From_Date: from_date ?? defaultFrom,
          Accounting_To_Date: to_date ?? defaultTo,
          Journal_Number: journal_number,
        },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleGetPayments(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { page, count, start_date, end_date } = args as {
    page?: number;
    count?: number;
    start_date?: string;
    end_date?: string;
  };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      getPayments,
      {
        Response_Filter: { Page: page, Count: count },
        Request_Criteria: {
          Payment_Date_Range: {
            Start_Date: start_date,
            End_Date: end_date,
          },
        },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleCreateJournal(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { accounting_date, company_id, currency_code, memo, lines } = args as {
    accounting_date: string;
    company_id: string;
    currency_code: string;
    memo?: string;
    lines: Array<{
      ledger_account_id: string;
      debit_amount?: number;
      credit_amount?: number;
      cost_center_id?: string;
      memo?: string;
    }>;
  };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      submitAccountingJournal,
      {
        Accounting_Journal_Data: {
          Accounting_Date: accounting_date,
          Company_Reference: {
            ID: [{ $value:company_id, attributes: { "wd:type": "Company_Reference_ID" } }],
          },
          Currency_Reference: {
            ID: [{ $value:currency_code, attributes: { "wd:type": "Currency_ID" } }],
          },
          Memo: memo,
          Journal_Entry_Line_Replacement_Data: lines.map((l) => ({
            Ledger_Account_Reference: {
              ID: [{ $value:l.ledger_account_id, attributes: { "wd:type": "Ledger_Account_ID" } }],
            },
            Debit_Amount: l.debit_amount,
            Credit_Amount: l.credit_amount,
            Cost_Center_Reference: l.cost_center_id
              ? { ID: [{ $value:l.cost_center_id, attributes: { "wd:type": "Cost_Center_Reference_ID" } }] }
              : undefined,
            Memo: l.memo,
          })),
        },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}
