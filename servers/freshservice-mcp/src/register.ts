import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "./client.js";

// Phase 2: Core ITSM
import { registerTicketsModule } from "./tools/tickets/index.js";
import { registerProblemsModule } from "./tools/problems/index.js";
import { registerChangesModule } from "./tools/changes/index.js";
import { registerReleasesModule } from "./tools/releases/index.js";
import { registerAgentsModule } from "./tools/agents/index.js";
import { registerRequestersModule } from "./tools/requesters/index.js";
import { registerGroupsModule } from "./tools/groups/index.js";

// Phase 3: Asset Management
import { registerAllAssetTools } from "./tools/assets/index.js";
import { registerAllSoftwareTools } from "./tools/software/index.js";
import { registerContractTools } from "./tools/contracts/index.js";
import { registerVendorTools } from "./tools/vendors/index.js";
import { registerProductTools } from "./tools/products/index.js";
import { registerPurchaseOrderTools } from "./tools/purchase-orders/index.js";

// Phase 4: Knowledge & Service
import { registerAllSolutionTools } from "./tools/solutions/index.js";
import { registerAllServiceCatalogTools } from "./tools/service-catalog/index.js";
import { registerAnnouncementTools } from "./tools/announcements/index.js";

// Phase 5: People & Organization
import { registerDepartmentTools } from "./tools/departments/index.js";
import { registerLocationTools } from "./tools/locations/index.js";
import { registerRoleTools } from "./tools/roles/index.js";
import { registerWorkspaceTools } from "./tools/workspaces/index.js";
import { registerOnboardingTools } from "./tools/onboarding/index.js";
import { registerJourneyTools } from "./tools/journeys/index.js";
import { registerDelegationTools } from "./tools/delegations/index.js";

// Phase 6: Operations
import { registerOncallTools } from "./tools/oncall/index.js";
import { registerAlertTools } from "./tools/alerts/index.js";
import { registerStatusPageTools } from "./tools/status-page/index.js";

// Phase 7: Remaining
import { registerCustomObjectTools } from "./tools/custom-objects/index.js";
import { registerBusinessHoursTools } from "./tools/business-hours/index.js";
import { registerCabTools } from "./tools/cabs/index.js";
import { registerCannedResponseTools } from "./tools/canned-responses/index.js";
import { registerSLAPolicyTools } from "./tools/sla-policies/index.js";
import { registerAuditLogTools } from "./tools/audit-logs/index.js";
import { registerAttachmentTools } from "./tools/attachments/index.js";
import { registerIncidentTemplateTools } from "./tools/incident-templates/index.js";
import { registerProjectTools } from "./tools/projects/index.js";

export function registerAllTools(server: McpServer, client: FreshServiceClient): void {
  // Phase 2: Core ITSM
  registerTicketsModule(server, client);
  registerProblemsModule(server, client);
  registerChangesModule(server, client);
  registerReleasesModule(server, client);
  registerAgentsModule(server, client);
  registerRequestersModule(server, client);
  registerGroupsModule(server, client);

  // Phase 3: Asset Management
  registerAllAssetTools(server, client);
  registerAllSoftwareTools(server, client);
  registerContractTools(server, client);
  registerVendorTools(server, client);
  registerProductTools(server, client);
  registerPurchaseOrderTools(server, client);

  // Phase 4: Knowledge & Service
  registerAllSolutionTools(server, client);
  registerAllServiceCatalogTools(server, client);
  registerAnnouncementTools(server, client);

  // Phase 5: People & Organization
  registerDepartmentTools(server, client);
  registerLocationTools(server, client);
  registerRoleTools(server, client);
  registerWorkspaceTools(server, client);
  registerOnboardingTools(server, client);
  registerJourneyTools(server, client);
  registerDelegationTools(server, client);

  // Phase 6: Operations
  registerOncallTools(server, client);
  registerAlertTools(server, client);
  registerStatusPageTools(server, client);

  // Phase 7: Remaining
  registerCustomObjectTools(server, client);
  registerBusinessHoursTools(server, client);
  registerCabTools(server, client);
  registerCannedResponseTools(server, client);
  registerSLAPolicyTools(server, client);
  registerAuditLogTools(server, client);
  registerAttachmentTools(server, client);
  registerIncidentTemplateTools(server, client);
  registerProjectTools(server, client);
}
