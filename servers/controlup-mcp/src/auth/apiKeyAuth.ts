import type { TokenProvider } from "./types.js";

export class ApiKeyAuthProvider implements TokenProvider {
  constructor(private apiKey: string) {}

  async getToken(): Promise<string> {
    return this.apiKey;
  }
}
