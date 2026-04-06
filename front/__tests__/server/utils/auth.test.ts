import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createEvent } from "h3";
import { IncomingMessage, ServerResponse } from "node:http";

// verifyAuth / createError は Nitro オートインポートのため、
// ここでは auth.ts の実装を直接テストするために明示的にモックする

const mockGetUser = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.stubGlobal("createError", ({ statusCode, message }: { statusCode: number; message: string }) => {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
});

function makeEvent(token?: string) {
  const req = Object.assign(new IncomingMessage(null as never), {
    method: "POST",
    url: "/api/spots",
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  const res = new ServerResponse(req);
  return createEvent(req, res);
}

// --- verifyOwner テスト ---

describe("verifyOwner", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("N-1: ALLOWED_EMAILS に含まれるメールでアクセスすると通過する", async () => {
    process.env.SUPABASE_URL = "https://dummy.supabase.co";
    process.env.SUPABASE_KEY = "dummy-key";
    process.env.ALLOWED_EMAILS = "owner@example.com";

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "owner@example.com" } },
      error: null,
    });

    const { verifyOwner } = await import("../../../server/utils/auth");
    const event = makeEvent("valid-token");
    const user = await verifyOwner(event);

    expect(user.email).toBe("owner@example.com");
  });

  it("A-1: ALLOWED_EMAILS に含まれないメールは 403 を返す", async () => {
    process.env.SUPABASE_URL = "https://dummy.supabase.co";
    process.env.SUPABASE_KEY = "dummy-key";
    process.env.ALLOWED_EMAILS = "owner@example.com";

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-2", email: "other@example.com" } },
      error: null,
    });

    const { verifyOwner } = await import("../../../server/utils/auth");
    const event = makeEvent("valid-token");

    await expect(verifyOwner(event)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("A-2: ALLOWED_EMAILS が未設定の場合は 403 を返す", async () => {
    process.env.SUPABASE_URL = "https://dummy.supabase.co";
    process.env.SUPABASE_KEY = "dummy-key";
    delete process.env.ALLOWED_EMAILS;

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "owner@example.com" } },
      error: null,
    });

    const { verifyOwner } = await import("../../../server/utils/auth");
    const event = makeEvent("valid-token");

    await expect(verifyOwner(event)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("N-2: 複数メール設定時、該当するメールは通過する", async () => {
    process.env.SUPABASE_URL = "https://dummy.supabase.co";
    process.env.SUPABASE_KEY = "dummy-key";
    process.env.ALLOWED_EMAILS = "owner@example.com, admin@example.com";

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-2", email: "admin@example.com" } },
      error: null,
    });

    const { verifyOwner } = await import("../../../server/utils/auth");
    const event = makeEvent("valid-token");
    const user = await verifyOwner(event);

    expect(user.email).toBe("admin@example.com");
  });
});
