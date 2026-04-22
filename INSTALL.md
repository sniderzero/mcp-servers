# Installing Greenhouse MCP Server

## Claude Desktop Config

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "greenhouse": {
      "command": "node",
      "args": ["/absolute/path/to/greenhouse-mcp/dist/index.js"],
      "env": {
        "GREENHOUSE_CLIENT_ID": "your-oauth-client-id",
        "GREENHOUSE_CLIENT_SECRET": "your-oauth-client-secret",
        "GREENHOUSE_BOARD_TOKEN": "your-board-token-slug"
      }
    }
  }
}
```

## Required Environment Variables

| Variable | Description |
|---|---|
| `GREENHOUSE_CLIENT_ID` | OAuth client ID (Settings > Dev Center > OAuth Applications) |
| `GREENHOUSE_CLIENT_SECRET` | OAuth client secret |
| `GREENHOUSE_BOARD_TOKEN` | Your job board token (the slug in your Greenhouse career site URL) |

## Optional Environment Variables

| Variable | Description |
|---|---|
| `GREENHOUSE_HARVEST_USER_EMAIL` | Your Greenhouse account email. Resolved to a user ID automatically on first request via `GET /v3/users`. |
| `GREENHOUSE_HARVEST_USER_ID` | Your Greenhouse numeric user ID. Use this instead of `GREENHOUSE_HARVEST_USER_EMAIL` if you already know it. If neither is set, requests run as the Integration Service User (ISU). |
| `GREENHOUSE_JOBBOARD_API_KEY` | Required for application submission via Job Board API |
| `GREENHOUSE_AUDIT_USER_ID` | User ID for Audit Log JWT acquisition |
| `GREENHOUSE_ONBOARDING_ACCESS_KEY` | Greenhouse Onboarding API access key |
| `GREENHOUSE_ONBOARDING_SECRET_KEY` | Greenhouse Onboarding API secret key |
