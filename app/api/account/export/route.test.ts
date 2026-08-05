import { beforeEach, describe, expect, it, vi } from "vitest";

type AuthResult =
  | { userId: string; unauthorized: null }
  | { userId: null; unauthorized: Response };

const sampleExport = {
  format: "budgetrax-account-export",
  formatVersion: 1,
  exportedAt: "2026-01-01T00:00:00.000Z",
  account: { id: "user-1", name: "Test User", email: "test@example.com", preferredCurrency: "CAD" },
  transactions: [],
};

const { buildUserDataExportMock, requireApiUserIdMock } = vi.hoisted(() => ({
  buildUserDataExportMock: vi.fn(async () => sampleExport),
  requireApiUserIdMock: vi.fn(async (): Promise<AuthResult> => ({
    userId: "user-1",
    unauthorized: null,
  })),
}));

vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));
vi.mock("@/lib/auth/api-auth", () => ({ requireApiUserId: requireApiUserIdMock }));
vi.mock("@/lib/data/account-data", () => ({ buildUserDataExport: buildUserDataExportMock }));

const { GET } = await import("@/app/api/account/export/route");

describe("GET /api/account/export", () => {
  beforeEach(() => {
    buildUserDataExportMock.mockClear();
    requireApiUserIdMock.mockClear();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null });
  });

  it("returns the full export as a downloadable JSON attachment", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Content-Disposition")).toMatch(/^attachment; filename="budgetrax-export-.*\.json"$/);
    expect(await response.json()).toEqual(sampleExport);
    expect(buildUserDataExportMock).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 and never builds an export when unauthenticated", async () => {
    requireApiUserIdMock.mockResolvedValueOnce({
      userId: null,
      unauthorized: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const response = await GET();
    expect(response.status).toBe(401);
    expect(buildUserDataExportMock).not.toHaveBeenCalled();
  });
});
