export interface TokenProvider {
  getToken(): Promise<string>;
  getHost(): string;
}
