import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

export enum FaultType {
  RETRYABLE = "RETRYABLE",
  PERMANENT = "PERMANENT",
  AUTH_EXPIRED = "AUTH_EXPIRED",
}

export interface WorkdayError {
  faultType: FaultType;
  message: string;
  details?: string;
  statusCode?: number;
  soapFaultCode?: string;
}

interface SoapFault {
  faultcode?: string;
  faultstring?: string;
  detail?: unknown;
  statusCode?: number;
}

export function classifySoapFault(fault: SoapFault): FaultType {
  const code = fault.faultcode ?? "";
  const statusCode = fault.statusCode;

  if (statusCode === 401) return FaultType.AUTH_EXPIRED;
  if (statusCode === 429 || statusCode === 503) return FaultType.RETRYABLE;

  // Workday validation faults are permanent
  if (code.includes("VALIDATION_ERROR") || code.includes("Client")) {
    return FaultType.PERMANENT;
  }

  // Server-side transient faults
  if (code.includes("Server") || statusCode === 500 || statusCode === 502) {
    return FaultType.RETRYABLE;
  }

  return FaultType.PERMANENT;
}

export function classifyRestError(error: { status?: number; code?: string }): FaultType {
  const status = error.status;
  const code = error.code ?? "";

  if (status === 401) return FaultType.AUTH_EXPIRED;
  if (status === 429 || status === 503) return FaultType.RETRYABLE;
  if (code === "ETIMEDOUT" || code === "ECONNRESET" || code === "ECONNREFUSED") {
    return FaultType.RETRYABLE;
  }
  if (status !== undefined && status >= 500) return FaultType.RETRYABLE;

  return FaultType.PERMANENT;
}

export function normalizeError(error: unknown): McpError {
  if (error instanceof McpError) return error;

  if (error instanceof Error) {
    const anyErr = error as Error & { status?: number; statusCode?: number; faultcode?: string };
    const statusCode = anyErr.status ?? anyErr.statusCode;
    const soapFaultCode = anyErr.faultcode;

    if (statusCode === 401) {
      return new McpError(ErrorCode.InvalidRequest, `Authentication expired: ${error.message}`);
    }
    if (statusCode === 429) {
      return new McpError(ErrorCode.InternalError, `Rate limit exceeded: ${error.message}`);
    }
    if (soapFaultCode) {
      return new McpError(ErrorCode.InternalError, `SOAP fault [${soapFaultCode}]: ${error.message}`);
    }
    return new McpError(ErrorCode.InternalError, error.message);
  }

  return new McpError(ErrorCode.InternalError, String(error));
}
