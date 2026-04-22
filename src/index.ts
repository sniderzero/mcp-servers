#!/usr/bin/env node
import { config } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HarvestClient } from "./clients/harvest.js";
import { JobBoardClient } from "./clients/jobboard.js";
import { AuditLogClient } from "./clients/auditlog.js";
import { OnboardingClient } from "./clients/onboarding.js";
import { registerJobsTools } from "./tools/harvest/jobs.js";
import { registerCandidatesTools } from "./tools/harvest/candidates.js";
import { registerApplicationsTools } from "./tools/harvest/applications.js";
import { registerUsersTools } from "./tools/harvest/users.js";
import { registerDepartmentsTools } from "./tools/harvest/departments.js";
import { registerOfficesTools } from "./tools/harvest/offices.js";
import { registerInterviewsTools } from "./tools/harvest/interviews.js";
import { registerScorecardsTools } from "./tools/harvest/scorecards.js";
import { registerInterviewKitsTools } from "./tools/harvest/interview-kits.js";
import { registerOffersTools } from "./tools/harvest/offers.js";
import { registerJobPostsTools } from "./tools/harvest/job-posts.js";
import { registerNotesTools } from "./tools/harvest/notes.js";
import { registerAttachmentsTools } from "./tools/harvest/attachments.js";
import { registerCustomFieldsTools } from "./tools/harvest/custom-fields.js";
import { registerJobOpeningsTools } from "./tools/harvest/job-openings.js";
import { registerTagsTools } from "./tools/harvest/tags.js";
import { registerSourcesTools } from "./tools/harvest/sources.js";
import { registerTrackingLinksTools } from "./tools/harvest/tracking-links.js";
import { registerRejectionReasonsTools } from "./tools/harvest/rejection-reasons.js";
import { registerCloseReasonsTools } from "./tools/harvest/close-reasons.js";
import { registerProspectPoolsTools } from "./tools/harvest/prospect-pools.js";
import { registerEmailTemplatesTools } from "./tools/harvest/email-templates.js";
import { registerEeocTools } from "./tools/harvest/eeoc.js";
import { registerDemographicDataTools } from "./tools/harvest/demographic-data.js";
import { registerUserRolesTools } from "./tools/harvest/user-roles.js";
import { registerUserPermissionsTools } from "./tools/harvest/user-permissions.js";
import { registerApprovalsTools } from "./tools/harvest/approvals.js";
import { registerJobBoardJobsTools } from "./tools/jobboard/jobs.js";
import { registerJobBoardDepartmentsTools } from "./tools/jobboard/departments.js";
import { registerJobBoardOfficesTools } from "./tools/jobboard/offices.js";
import { registerJobBoardApplicationsTools } from "./tools/jobboard/applications.js";
import { registerAuditLogTools } from "./tools/auditlog/events.js";
import { registerEmployeesOnboardingTools } from "./tools/onboarding/employees.js";
import { registerPendingHiresOnboardingTools } from "./tools/onboarding/pending-hires.js";
import { registerDepartmentsOnboardingTools } from "./tools/onboarding/departments.js";
import { registerLocationsOnboardingTools } from "./tools/onboarding/locations.js";
import { registerTeamsOnboardingTools } from "./tools/onboarding/teams.js";
import { registerCustomFieldsOnboardingTools } from "./tools/onboarding/custom-fields.js";

// Load .env — quiet suppresses dotenvx stdout logging which would corrupt MCP stdio
config({ path: join(process.cwd(), ".env"), quiet: true } as Parameters<typeof config>[0]);

// Load user config saved by setup
const userConfig = join(homedir(), ".greenhouse-mcp", "config.json");
if (existsSync(userConfig)) {
  try {
    const saved = JSON.parse(readFileSync(userConfig, "utf-8")) as Record<string, string>;
    for (const [k, v] of Object.entries(saved)) {
      if (!process.env[k]) process.env[k] = v;
    }
  } catch { /* ignore */ }
}

async function main() {
  // Handle setup subcommand before env validation
  if (process.argv[2] === "setup") {
    const { runSetup } = await import("./setup.js");
    await runSetup();
    process.exit(0);
  }

  const clientId = process.env.GREENHOUSE_CLIENT_ID;
  const clientSecret = process.env.GREENHOUSE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    process.stderr.write(
      "Error: GREENHOUSE_CLIENT_ID and GREENHOUSE_CLIENT_SECRET are required.\n\n" +
      "Required:\n" +
      "  GREENHOUSE_CLIENT_ID       OAuth client ID (Greenhouse Settings > Dev Center > OAuth Applications)\n" +
      "  GREENHOUSE_CLIENT_SECRET   OAuth client secret\n" +
      "  GREENHOUSE_BOARD_TOKEN     Job board token (your org slug)\n" +
      "\nOptional:\n" +
      "  GREENHOUSE_HARVEST_USER_EMAIL  Your Greenhouse email (resolved to user ID automatically)\n" +
      "  GREENHOUSE_HARVEST_USER_ID     Explicit numeric user ID (overrides email resolution)\n" +
      "  GREENHOUSE_JOBBOARD_API_KEY    Required for job application submission\n" +
      "  GREENHOUSE_AUDIT_USER_ID       Required for Audit Log tools\n" +
      "  GREENHOUSE_ONBOARDING_ACCESS_KEY / GREENHOUSE_ONBOARDING_SECRET_KEY\n"
    );
    process.exit(1);
  }

  const server = new McpServer({ name: "greenhouse", version: "0.2.0" });

  const harvestClient = new HarvestClient(
    clientId,
    clientSecret,
    process.env.GREENHOUSE_HARVEST_USER_ID,
  );
  const boardToken = process.env.GREENHOUSE_BOARD_TOKEN ?? "";
  const jobBoardClient = new JobBoardClient(boardToken);
  const auditUserId = process.env.GREENHOUSE_AUDIT_USER_ID ?? "";
  const auditLogClient = new AuditLogClient(clientId, auditUserId);

  // Harvest tools
  registerJobsTools(server, harvestClient);
  registerCandidatesTools(server, harvestClient);
  registerApplicationsTools(server, harvestClient);
  registerUsersTools(server, harvestClient);
  registerDepartmentsTools(server, harvestClient);
  registerOfficesTools(server, harvestClient);
  registerInterviewsTools(server, harvestClient);
  registerScorecardsTools(server, harvestClient);
  registerInterviewKitsTools(server, harvestClient);
  registerOffersTools(server, harvestClient);
  registerJobPostsTools(server, harvestClient);
  registerNotesTools(server, harvestClient);
  registerAttachmentsTools(server, harvestClient);
  registerCustomFieldsTools(server, harvestClient);
  registerJobOpeningsTools(server, harvestClient);
  registerTagsTools(server, harvestClient);
  registerSourcesTools(server, harvestClient);
  registerTrackingLinksTools(server, harvestClient);
  registerRejectionReasonsTools(server, harvestClient);
  registerCloseReasonsTools(server, harvestClient);
  registerProspectPoolsTools(server, harvestClient);
  registerEmailTemplatesTools(server, harvestClient);
  registerEeocTools(server, harvestClient);
  registerDemographicDataTools(server, harvestClient);
  registerUserRolesTools(server, harvestClient);
  registerUserPermissionsTools(server, harvestClient);
  registerApprovalsTools(server, harvestClient);

  // Job Board tools
  registerJobBoardJobsTools(server, jobBoardClient);
  registerJobBoardDepartmentsTools(server, jobBoardClient);
  registerJobBoardOfficesTools(server, jobBoardClient);
  registerJobBoardApplicationsTools(server, jobBoardClient);

  // Audit Log tools
  registerAuditLogTools(server, auditLogClient);

  // Onboarding tools (conditional on credentials)
  const onboardingAccessKey = process.env.GREENHOUSE_ONBOARDING_ACCESS_KEY;
  const onboardingSecretKey = process.env.GREENHOUSE_ONBOARDING_SECRET_KEY ?? "";
  if (onboardingAccessKey) {
    const onboardingClient = new OnboardingClient(onboardingAccessKey, onboardingSecretKey);
    registerEmployeesOnboardingTools(server, onboardingClient);
    registerPendingHiresOnboardingTools(server, onboardingClient);
    registerDepartmentsOnboardingTools(server, onboardingClient);
    registerLocationsOnboardingTools(server, onboardingClient);
    registerTeamsOnboardingTools(server, onboardingClient);
    registerCustomFieldsOnboardingTools(server, onboardingClient);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
