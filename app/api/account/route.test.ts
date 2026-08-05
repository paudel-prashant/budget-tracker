import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type AuthResult =
  | { userId: string; unauthorized: null }
  | { userId: null; unauthorized: Response };

const { deleteUserAccountMock, requireApiUserIdMock } = vi.hoisted(() => ({
  deleteUserAccountMock: vi.fn(async () => undefined),
  requireApiUserIdMock: vi.fn(async (): Promise<AuthResult> => ({
    userId: "user-1",
    unauthorized: null,
  })),
}));

vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));
vi.mock("@/lib/auth/api-auth", () => ({ requireApiUserId: requireApiUserIdMock }));
vi.mock("@/lib/data/account-data", () => ({ deleteUserAccount: deleteUserAccountMock }));

const { DELETE } = await import("@/app/api/account/route");

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/account", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("DELETE /api/account", () => {
  beforeEach(() => {
    deleteUserAccountMock.mockClear();
    requireApiUserIdMock.mockClear();
    requireApiUserIdMock.mockResolvedValue({ userId: "user-1", unauthorized: null });
  });

  it("deletes the account when the confirmation phrase matches", async () => {
    const response = await DELETE(makeRequest({ confirm: "DELETE" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(deleteUserAccountMock).toHaveBeenCalledWith("user-1");
  });

  it("rejects a missing confirmation phrase without deleting anything", async () => {
    const response = await DELETE(makeRequest({}));
    expect(response.status).toBe(400);
    expect(deleteUserAccountMock).not.toHaveBeenCalled();
  });

  it("rejects a wrong confirmation phrase without deleting anything", async () => {
    const response = await DELETE(makeRequest({ confirm: "delete" }));
    expect(response.status).toBe(400);
    expect(deleteUserAccountMock).not.toHaveBeenCalled();
  });

  it("returns 401 and never deletes when unauthenticated", async () => {
    requireApiUserIdMock.mockResolvedValueOnce({
      userId: null,
      unauthorized: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const response = await DELETE(makeRequest({ confirm: "DELETE" }));
    expect(response.status).toBe(401);
    expect(deleteUserAccountMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an unparsable JSON body without deleting anything", async () => {
    const badRequest = new NextRequest("http://localhost/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const response = await DELETE(badRequest);
    expect(response.status).toBe(400);
    expect(deleteUserAccountMock).not.toHaveBeenCalled();
  });
});
