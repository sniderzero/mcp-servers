import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCandidatesTools } from "../../../../src/tools/harvest/candidates.js";

describe("registerCandidatesTools", () => {
  it("registers expected tools on the server", () => {
    const mockServer = { tool: vi.fn() } as unknown as McpServer;
    const mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as any;

    registerCandidatesTools(mockServer, mockClient);

    const toolNames = (mockServer.tool as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: unknown[]) => c[0]
    );
    expect(toolNames).toContain("greenhouse_harvest_candidates_list");
    expect(toolNames).toContain("greenhouse_harvest_candidates_get");
    expect(toolNames).toContain("greenhouse_harvest_candidates_create");
    expect(toolNames).toContain("greenhouse_harvest_candidates_merge");
  });
});
