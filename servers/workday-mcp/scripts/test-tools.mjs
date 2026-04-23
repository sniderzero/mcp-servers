#!/usr/bin/env node
/**
 * workday-mcp integration test runner
 *
 * Spawns the MCP server via stdio, connects with the MCP SDK Client,
 * and calls every read-only tool. Write tools are included but gated
 * behind --write flag to avoid creating real data.
 *
 * Usage:
 *   node scripts/test-tools.mjs           # read-only tests
 *   node scripts/test-tools.mjs --write   # include write tools (creates real data!)
 *   node scripts/test-tools.mjs --tool workday_get_invoices
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ENTRY = path.join(__dirname, "../dist/index.js");

const args = process.argv.slice(2);
const INCLUDE_WRITE = args.includes("--write");
const ONLY_TOOL = args.includes("--tool") ? args[args.indexOf("--tool") + 1] : null;

// ── ANSI colours ──────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

function pass(label) { return `${c.green}✓${c.reset} ${label}`; }
function fail(label) { return `${c.red}✗${c.reset} ${label}`; }
function skip(label) { return `${c.yellow}⊘${c.reset} ${c.dim}${label}${c.reset}`; }

// ── Test definitions ──────────────────────────────────────────────────────────
// Each test: { name, args, write?, validate? }
// validate(result) → throw if something looks wrong
const TESTS = [
  // ── Financial: Invoices ────────────────────────────────────────────────────
  {
    name: "workday_get_invoices",
    args: { page: 1, count: 5 },
    validate: (r) => assertArray(r, "invoices"),
  },
  {
    name: "workday_get_invoice_adjustments",
    args: { page: 1, count: 5 },
  },

  // ── Financial: Accounts ───────────────────────────────────────────────────
  {
    name: "workday_get_business_units",
    args: { page: 1, count: 5 },
    validate: (r) => assertArray(r, "businessUnits"),
  },
  {
    name: "workday_get_posting_rules",
    args: { page: 1, count: 5 },
  },
  {
    name: "workday_get_financial_institutions",
    args: { page: 1, count: 5 },
  },

  // ── Financial: Journals ───────────────────────────────────────────────────
  {
    name: "workday_get_journals",
    args: { page: 1, count: 5 },
  },
  {
    name: "workday_get_payments",
    args: { page: 1, count: 5 },
  },

  // ── Procurement ───────────────────────────────────────────────────────────
  {
    name: "workday_get_purchase_orders",
    args: { page: 1, count: 5, start_date: "2024-01-01", end_date: "2024-12-31" },
  },

  // ── Reporting: WQL ────────────────────────────────────────────────────────
  {
    name: "workday_wql_query",
    args: { query: "SELECT workdayID, fullName FROM workers LIMIT 5", limit: 5 },
    validate: (r) => assertHasKey(r, "data"),
  },
  {
    name: "workday_wql_query_all",
    args: { query: "SELECT workdayID, fullName FROM workers LIMIT 10", page_size: 10 },
    validate: (r) => assertHasKey(r, "data"),
  },

  // ── Reporting: RaaS ───────────────────────────────────────────────────────
  // report_url or report_path required — skip unless user overrides
  {
    name: "workday_run_report",
    args: { report_path: "/ccx/service/customreport2/ascendtogether_preview/INT-RPT-001" },
    write: false,
    note: "Provide a valid report path for your tenant — update in test script",
    skip: true,
  },

  // ── Security: Workers & Accounts ─────────────────────────────────────────
  {
    name: "workday_get_workers",
    args: { page: 1, count: 5, include_personal_info: true },
    validate: (r) => assertHasKey(r, "Response_Data"),
  },
  {
    name: "workday_get_workday_account",
    args: { page: 1, count: 5 },
    validate: (r) => assertHasKey(r, "Response_Data"),
  },
  {
    name: "workday_get_provisioning_groups",
    args: { page: 1, count: 5, include_group_data: true },
    validate: (r) => assertHasKey(r, "Response_Data"),
  },
  {
    name: "workday_get_provisioning_group_assignments",
    args: { page: 1, count: 5 },
    validate: (r) => assertHasKey(r, "Response_Data"),
  },

  // ── Write tools (only run with --write) ───────────────────────────────────
  {
    name: "workday_create_invoice",
    write: true,
    args: {
      invoice_number: "TEST-INV-001",
      invoice_date: "2024-04-23",
      supplier_id: "SUPPLIER_ID_HERE",
      currency_code: "USD",
      memo: "Test invoice from test-tools.mjs",
      lines: [{ description: "Test line", quantity: 1, unit_cost: 100.00 }],
    },
    note: "Fill in supplier_id before running",
  },
  {
    name: "workday_create_journal",
    write: true,
    args: {
      journal_source: "Manual",
      accounting_date: "2024-04-23",
      memo: "Test journal from test-tools.mjs",
      lines: [
        { account_id: "ACCT_ID_HERE", debit_amount: 100.00, memo: "Debit line" },
        { account_id: "ACCT_ID_HERE", credit_amount: 100.00, memo: "Credit line" },
      ],
    },
    note: "Fill in account_id values before running",
  },
  {
    name: "workday_create_purchase_order",
    write: true,
    args: {
      supplier_id: "SUPPLIER_ID_HERE",
      currency_code: "USD",
      memo: "Test PO from test-tools.mjs",
      lines: [{ description: "Test item", quantity: 1, unit_cost: 50.00 }],
    },
    note: "Fill in supplier_id before running",
  },
];

// ── Validators ────────────────────────────────────────────────────────────────
function assertArray(result, key) {
  const data = result?.[key] ?? result?.data ?? result;
  if (!Array.isArray(data)) throw new Error(`Expected array (key: ${key}), got: ${JSON.stringify(data).slice(0, 80)}`);
}
function assertHasKey(result, key) {
  if (result?.[key] === undefined) throw new Error(`Expected key "${key}" in result`);
}

// ── Runner ────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n${c.bold}${c.cyan}workday-mcp test runner${c.reset}`);
  console.log(`${c.dim}Server: ${SERVER_ENTRY}${c.reset}`);
  console.log(`${c.dim}Write tests: ${INCLUDE_WRITE ? "ENABLED ⚠️" : "disabled (pass --write to enable)"}${c.reset}\n`);

  // Connect
  const transport = new StdioClientTransport({
    command: "node",
    args: [SERVER_ENTRY],
  });

  const client = new Client({ name: "test-runner", version: "1.0.0" });

  try {
    await client.connect(transport);
    console.log(`${c.green}Connected to server${c.reset}\n`);
  } catch (err) {
    console.error(`${c.red}Failed to connect: ${err.message}${c.reset}`);
    process.exit(1);
  }

  // List available tools for sanity check
  const { tools } = await client.listTools();
  console.log(`${c.dim}Server exposes ${tools.length} tools${c.reset}\n`);

  // Run tests
  const results = { pass: 0, fail: 0, skip: 0 };
  const failures = [];

  for (const test of TESTS) {
    if (ONLY_TOOL && test.name !== ONLY_TOOL) continue;

    const label = `${c.bold}${test.name}${c.reset}`;

    if (test.skip) {
      console.log(skip(`${test.name}${test.note ? `  — ${test.note}` : ""}`));
      results.skip++;
      continue;
    }

    if (test.write && !INCLUDE_WRITE) {
      console.log(skip(`${test.name}  — write tool, skipped`));
      results.skip++;
      continue;
    }

    try {
      const start = Date.now();
      const response = await client.callTool({ name: test.name, arguments: test.args });
      const ms = Date.now() - start;

      // MCP tool errors come back as content with isError flag
      if (response.isError) {
        const msg = response.content?.[0]?.text ?? "unknown error";
        throw new Error(msg);
      }

      // Parse content text as JSON if possible
      const raw = response.content?.[0]?.text;
      let parsed;
      try { parsed = JSON.parse(raw); } catch { parsed = raw; }

      if (test.validate) test.validate(parsed);

      const preview = JSON.stringify(parsed).slice(0, 100);
      console.log(`${pass(label)}  ${c.dim}(${ms}ms)${c.reset}`);
      console.log(`  ${c.dim}${preview}${preview.length >= 100 ? "…" : ""}${c.reset}`);
      results.pass++;

    } catch (err) {
      console.log(`${fail(label)}`);
      console.log(`  ${c.red}${err.message}${c.reset}`);
      results.fail++;
      failures.push({ name: test.name, error: err.message });
    }
  }

  // Summary
  console.log(`\n${"─".repeat(50)}`);
  console.log(
    `${c.bold}Results:${c.reset}  ` +
    `${c.green}${results.pass} passed${c.reset}  ` +
    `${c.red}${results.fail} failed${c.reset}  ` +
    `${c.yellow}${results.skip} skipped${c.reset}`
  );

  if (failures.length) {
    console.log(`\n${c.red}${c.bold}Failures:${c.reset}`);
    for (const f of failures) {
      console.log(`  ${c.red}${f.name}${c.reset}: ${f.error}`);
    }
  }

  await client.close();
  process.exit(results.fail > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(`${c.red}Unexpected error: ${err.message}${c.reset}`);
  process.exit(1);
});
