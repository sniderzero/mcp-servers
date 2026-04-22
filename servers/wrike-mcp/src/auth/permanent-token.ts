import type { TokenProvider } from "./types.js";

export class PermanentTokenProvider implements TokenProvider {
  private token: string;
  private host: string;

  constructor(token: string, host: string = "www.wrike.com") {
    this.token = token;
    this.host = host;
  }

  async getToken(): Promise<string> {
    return this.token;
  }

  getHost(): string {
    return this.host;
  }
}
