import type { AzureClient } from "../api/client.js";
import { getMsalClient } from "../auth/msalClient.js";

const SCOPES = ["https://management.azure.com/.default"];

export const AUTH_TOOL_DEFINITIONS = [
  {
    name: "azure_billing_auth_status",
    description: "Check whether the Azure Billing MCP server is currently authenticated with Azure",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "azure_billing_auth_login",
    description: "Authenticate or re-authenticate the Azure Billing MCP server with Azure using device code flow. Returns a URL and code to complete sign-in in your browser.",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
];

export async function handleAuthStatus(_args: unknown, _client: AzureClient): Promise<unknown> {
  try {
    const pca = getMsalClient();
    const accounts = await pca.getTokenCache().getAllAccounts();
    if (accounts.length > 0) {
      const result = await pca.acquireTokenSilent({ scopes: SCOPES, account: accounts[0] });
      if (result?.accessToken) {
        return { authenticated: true, message: "Authenticated. Token is valid and will refresh automatically.", account: accounts[0].username };
      }
    }
    return { authenticated: false, message: "Not authenticated or token expired. Call azure_billing_auth_login to sign in." };
  } catch {
    return { authenticated: false, message: "Not authenticated. Call azure_billing_auth_login to sign in." };
  }
}

export async function handleAuthLogin(_args: unknown, _client: AzureClient): Promise<unknown> {
  return new Promise((resolve) => {
    getMsalClient().acquireTokenByDeviceCode({
      scopes: SCOPES,
      deviceCodeCallback: (response) => {
        resolve({
          message: response.message,
          userCode: response.userCode,
          verificationUri: response.verificationUri,
          expiresIn: response.expiresIn,
          instructions: "Visit the URL above, enter the code, and sign in with your Azure account. The server will authenticate automatically once complete.",
        });
      },
    }).catch((err: Error) => {
      resolve({ error: `Authentication failed: ${err.message}` });
    });
  });
}
