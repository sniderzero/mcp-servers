function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    process.stderr.write(`[workday-mcp] Missing required env var: ${name}\n`);
    process.exit(1);
  }
  return value;
}

export interface WorkdayConfig {
  clientId: string;
  clientSecret: string;
  tenantUrl: string;
  apiVersion: string;
  oauthPort: number;
}

export const env = {
  WORKDAY_CLIENT_ID: requireEnv("WORKDAY_CLIENT_ID"),
  WORKDAY_CLIENT_SECRET: requireEnv("WORKDAY_CLIENT_SECRET"),
  WORKDAY_TENANT_URL: requireEnv("WORKDAY_TENANT_URL"),
  WORKDAY_API_VERSION: process.env["WORKDAY_API_VERSION"] ?? "v44.2",
  WORKDAY_OAUTH_PORT: parseInt(process.env["WORKDAY_OAUTH_PORT"] ?? "8080", 10),
  MCP_TRANSPORT: process.env["MCP_TRANSPORT"] ?? "stdio",
  PORT: parseInt(process.env["PORT"] ?? "7654", 10),
};
