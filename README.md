# MCP Servers

A monorepo containing all internal MCP (Model Context Protocol) servers.

## Servers

| Server | Description |
|--------|-------------|
| [azure-billing-mcp](servers/azure-billing-mcp/) | Azure billing and cost management |
| [controlup-mcp](servers/controlup-mcp/) | ControlUp platform integration |
| [dealcloud-mcp](servers/dealcloud-mcp/) | DealCloud CRM integration |
| [evisort-mcp](servers/evisort-mcp/) | Evisort contract intelligence |
| [freshservice-mcp](servers/freshservice-mcp/) | Freshservice ITSM integration |
| [greenhouse](servers/greenhouse/) | Greenhouse ATS integration |
| [m365-calendar-mcp](servers/m365-calendar-mcp/) | Microsoft 365 Calendar |
| [m365-mail-mcp](servers/m365-mail-mcp/) | Microsoft 365 Mail |
| [m365-mcp](servers/m365-mcp/) | Microsoft 365 core |
| [m365-sharepoint-mcp](servers/m365-sharepoint-mcp/) | Microsoft 365 SharePoint |
| [m365-teams-mcp](servers/m365-teams-mcp/) | Microsoft 365 Teams |
| [m365-todo-mcp](servers/m365-todo-mcp/) | Microsoft 365 Todo |
| [m365-users-mcp](servers/m365-users-mcp/) | Microsoft 365 Users |
| [nerdio-mcp](servers/nerdio-mcp/) | Nerdio AVD management |
| [PlannerMCP](servers/PlannerMCP/) | Microsoft Planner integration |
| [workday-mcp](servers/workday-mcp/) | Workday HCM integration |
| [wrike-mcp](servers/wrike-mcp/) | Wrike project management |

## Structure

```
mcp-servers/
└── servers/
    └── <server-name>/   # Each MCP server is self-contained
```

## Development

Each server is an independent Node.js/TypeScript package. Navigate into a server directory and follow its own `README` or `INSTALL.md` for setup instructions.
