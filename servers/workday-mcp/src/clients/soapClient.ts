import * as soapLib from "soap";
import type { Client } from "soap";
import type { TokenBucketRateLimiter } from "../utils/rateLimiter.js";
import { getWsdlUrl } from "../config/workdayEndpoints.js";
import { classifySoapFault, FaultType } from "../utils/errorHandler.js";

export class WorkdaySoapError extends Error {
  constructor(
    public readonly faultCode: string,
    public readonly faultString: string,
    public readonly statusCode?: number,
  ) {
    super(`SOAP fault [${faultCode}]: ${faultString}`);
    this.name = "WorkdaySoapError";
  }
}

export class WorkdaySoapClient {
  /** Cache parsed WSDL clients per service — only Bearer token swaps per request */
  private readonly clientCache = new Map<string, Client>();

  constructor(
    private readonly tenantUrl: string,
    private readonly rateLimiter: TokenBucketRateLimiter,
  ) {}

  async createClient(service: string, token: string): Promise<Client> {
    const cacheKey = `${service}:${token}`;
    let client = this.clientCache.get(service);
    if (!client) {
      const wsdlUrl = getWsdlUrl(this.tenantUrl, service);
      // Workday requires auth for WSDL endpoints too
      client = await soapLib.createClientAsync(wsdlUrl, {
        wsdl_headers: { Authorization: `Bearer ${token}` },
      });
      this.clientCache.set(service, client);
    }
    // Swap Bearer header for this request — NOT WS-Security
    client.addHttpHeader("Authorization", `Bearer ${token}`);
    return client;
  }

  async call(
    service: string,
    operation: string,
    body: Record<string, unknown>,
    token: string,
  ): Promise<unknown> {
    await this.rateLimiter.acquire();
    const client = await this.createClient(service, token);

    try {
      // soap package exposes `${operation}Async` for each WSDL operation
      const asyncMethod = (client as unknown as Record<string, Function>)[`${operation}Async`];
      if (typeof asyncMethod !== "function") {
        throw new Error(`SOAP operation not found: ${operation}`);
      }
      const [result] = await asyncMethod.call(client, body);
      return result;
    } catch (err) {
      const soapErr = err as { faultcode?: string; faultstring?: string; statusCode?: number };
      if (soapErr.faultcode) {
        const faultType = classifySoapFault({
          faultcode: soapErr.faultcode,
          faultstring: soapErr.faultstring,
          statusCode: soapErr.statusCode,
        });
        const error = new WorkdaySoapError(
          soapErr.faultcode,
          soapErr.faultstring ?? "Unknown fault",
          soapErr.statusCode,
        );
        (error as WorkdaySoapError & { faultType: FaultType }).faultType = faultType;
        throw error;
      }
      throw err;
    }
  }
}
