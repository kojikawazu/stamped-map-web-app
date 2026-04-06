import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createEvent } from "h3";
import { IncomingMessage, ServerResponse } from "node:http";

const verifyAuthMock = vi.fn();
vi.stubGlobal("verifyAuth", verifyAuthMock);

function makeEvent() {
  const req = Object.assign(new IncomingMessage(null as never), {
    method: "GET",
    url: "/api/me/is-owner",
    headers: { authorization: "Bearer test-token" },
  });
  const res = new ServerResponse(req);
  return createEvent(req, res);
}

describe("GET /api/me/is-owner", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("N-1: ALLOWED_EMAILS に含まれるメールのとき isOwner: true を返す", async () => {
    process.env.ALLOWED_EMAILS = "owner@example.com";
    verifyAuthMock.mockResolvedValue({ id: "user-1", email: "owner@example.com" });

    const handler = (await import("../../../../server/api/me/is-owner.get")).default;
    const result = await handler(makeEvent());

    expect(result.data.isOwner).toBe(true);
  });

  it("A-1: ALLOWED_EMAILS に含まれないメールのとき isOwner: false を返す", async () => {
    process.env.ALLOWED_EMAILS = "owner@example.com";
    verifyAuthMock.mockResolvedValue({ id: "user-2", email: "other@example.com" });

    const handler = (await import("../../../../server/api/me/is-owner.get")).default;
    const result = await handler(makeEvent());

    expect(result.data.isOwner).toBe(false);
  });

  it("A-2: ALLOWED_EMAILS が未設定のとき isOwner: false を返す", async () => {
    delete process.env.ALLOWED_EMAILS;
    verifyAuthMock.mockResolvedValue({ id: "user-1", email: "owner@example.com" });

    const handler = (await import("../../../../server/api/me/is-owner.get")).default;
    const result = await handler(makeEvent());

    expect(result.data.isOwner).toBe(false);
  });

  it("N-2: メールアドレスの大文字小文字を区別しない", async () => {
    process.env.ALLOWED_EMAILS = "Owner@Example.com";
    verifyAuthMock.mockResolvedValue({ id: "user-1", email: "owner@example.com" });

    const handler = (await import("../../../../server/api/me/is-owner.get")).default;
    const result = await handler(makeEvent());

    expect(result.data.isOwner).toBe(true);
  });
});
