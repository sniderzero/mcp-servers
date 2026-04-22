import {
  Client,
  type AuthenticationProvider,
} from "@microsoft/microsoft-graph-client";
import { getAccessToken, ALL_SCOPES } from "./auth.js";

function createGraphClient(): Client {
  const authProvider: AuthenticationProvider = {
    getAccessToken: () => getAccessToken(ALL_SCOPES),
  };

  return Client.initWithMiddleware({
    authProvider,
    defaultVersion: "v1.0",
  });
}

let graphClient: Client | null = null;

export function getGraphClient(): Client {
  if (!graphClient) {
    graphClient = createGraphClient();
  }
  return graphClient;
}
