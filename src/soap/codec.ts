import { z } from "zod";
import type { WorkdaySoapClient } from "../clients/soapClient.js";
import type { TokenBucketRateLimiter } from "../utils/rateLimiter.js";
import { withRetry, type RetryOptions } from "../utils/retryPolicy.js";
import { classifySoapFault, FaultType, normalizeError } from "../utils/errorHandler.js";

/** Defines a typed SOAP operation — the config object approach */
export interface SoapOperation<TReq, TRes> {
  service: string;
  version: string;
  operation: string;
  requestSchema: z.ZodType<TReq>;
  buildBody(req: TReq): Record<string, unknown>;
  parseResponse(raw: unknown): TRes;
}

export class SoapCodec {
  private readonly retryOptions: RetryOptions;

  constructor(
    private readonly soapClient: WorkdaySoapClient,
    private readonly rateLimiter: TokenBucketRateLimiter,
    retryOptions?: RetryOptions,
  ) {
    this.retryOptions = retryOptions ?? {};
  }

  async execute<TReq, TRes>(
    op: SoapOperation<TReq, TRes>,
    request: TReq,
    token: string,
  ): Promise<TRes> {
    // 1. Validate request against schema
    const parsed = op.requestSchema.safeParse(request);
    if (!parsed.success) {
      throw normalizeError(
        new Error(`Invalid request for ${op.operation}: ${parsed.error.message}`),
      );
    }

    // 2. Build SOAP body
    const body = op.buildBody(parsed.data);

    // 3. Execute with retry
    return withRetry(async () => {
      try {
        const raw = await this.soapClient.call(op.service, op.operation, body, token);
        return op.parseResponse(raw);
      } catch (err) {
        // Re-classify SOAP faults so retryPolicy acts correctly
        const soapErr = err as {
          faultcode?: string;
          faultstring?: string;
          statusCode?: number;
          faultType?: FaultType;
        };

        if (soapErr.faultcode && !soapErr.faultType) {
          const faultType = classifySoapFault({
            faultcode: soapErr.faultcode,
            statusCode: soapErr.statusCode,
          });
          soapErr.faultType = faultType;
        }
        throw err;
      }
    }, this.retryOptions);
  }
}
