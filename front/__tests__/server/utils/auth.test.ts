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

// createError の最小スタブ。auth.ts は apiError 経由で
// { statusCode, data: { code, message } } を渡すため、data もそのまま保持して
// テスト側でエラーコードを検証できるようにする。
vi.stubGlobal(
  "createError",
  ({
    statusCode,
    data,
  }: {
    statusCode: number;
    data?: { code: string; message: string };
  }) => {
    const err = new Error(data?.message) as Error & {
      statusCode: number;
      data?: { code: string; message: string };
    };
    err.statusCode = statusCode;
    err.data = data;
    return err;
  },
);

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

    await expect(verifyOwner(event)).rejects.toMatchObject({
      statusCode: 403,
      data: { code: "FORBIDDEN" },
    });
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

    await expect(verifyOwner(event)).rejects.toMatchObject({
      statusCode: 403,
      data: { code: "FORBIDDEN" },
    });
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

  it("N-3: ALLOWED_EMAILS が大文字でも小文字のメールと一致すると通過する", async () => {
    process.env.SUPABASE_URL = "https://dummy.supabase.co";
    process.env.SUPABASE_KEY = "dummy-key";
    process.env.ALLOWED_EMAILS = "Owner@Example.COM";

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "owner@example.com" } },
      error: null,
    });

    const { verifyOwner } = await import("../../../server/utils/auth");
    const event = makeEvent("valid-token");
    const user = await verifyOwner(event);

    expect(user.email).toBe("owner@example.com");
  });

  it("A-3: user.email が null の場合は 403 を返す", async () => {
    process.env.SUPABASE_URL = "https://dummy.supabase.co";
    process.env.SUPABASE_KEY = "dummy-key";
    process.env.ALLOWED_EMAILS = "owner@example.com";

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: null } },
      error: null,
    });

    const { verifyOwner } = await import("../../../server/utils/auth");
    const event = makeEvent("valid-token");

    await expect(verifyOwner(event)).rejects.toMatchObject({
      statusCode: 403,
      data: { code: "FORBIDDEN" },
    });
  });
});

// --- verifyAuth テスト（統一エラー形状の検証） ---

describe("verifyAuth", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("A-4: Authorization ヘッダーが無い場合は 401 UNAUTHORIZED を返す", async () => {
    process.env.SUPABASE_URL = "https://dummy.supabase.co";
    process.env.SUPABASE_KEY = "dummy-key";

    const { verifyAuth } = await import("../../../server/utils/auth");

    await expect(verifyAuth(makeEvent())).rejects.toMatchObject({
      statusCode: 401,
      data: { code: "UNAUTHORIZED", message: "認証が必要です" },
    });
  });

  it("A-5: トークンが無効な場合は 401 UNAUTHORIZED を返す", async () => {
    process.env.SUPABASE_URL = "https://dummy.supabase.co";
    process.env.SUPABASE_KEY = "dummy-key";

    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid token" },
    });

    const { verifyAuth } = await import("../../../server/utils/auth");

    await expect(verifyAuth(makeEvent("bad-token"))).rejects.toMatchObject({
      statusCode: 401,
      data: { code: "UNAUTHORIZED", message: "認証が無効です" },
    });
  });

  it("A-6: Supabase の URL/KEY 未設定時は 500 INTERNAL_ERROR を返す", async () => {
    // auth.ts は Supabase クライアントをモジュールレベルで singleton 化しているため、
    // 先行テストで初期化済みだと env 未設定の分岐に到達しない。
    // モジュールを破棄して未初期化状態から読み直す。
    vi.resetModules();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_KEY;

    const { verifyAuth } = await import("../../../server/utils/auth");

    await expect(verifyAuth(makeEvent("any-token"))).rejects.toMatchObject({
      statusCode: 500,
      data: { code: "INTERNAL_ERROR" },
    });
  });
});
