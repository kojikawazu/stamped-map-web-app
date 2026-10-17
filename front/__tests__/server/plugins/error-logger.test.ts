import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";

// Nitro プラグインの `error` フックに渡される値の形（テストで使う範囲のみ）。
type ErrorHook = (
  error: unknown,
  context: { event?: { method: string; path: string } },
) => void;

// defineNitroPlugin は Nitro のオートインポートのため、テスト環境では受け取った関数を
// そのまま返すグローバルとして注入する。プラグインには `error` フックの登録だけを受ける
// 最小の nitroApp を渡し、登録されたフックを直接呼んで挙動を検証する。
vi.stubGlobal("defineNitroPlugin", (plugin: unknown) => plugin);

let errorHook: ErrorHook;

beforeAll(async () => {
  const plugin = (await import("../../../server/plugins/error-logger"))
    .default as unknown as (nitroApp: unknown) => void;
  plugin({
    hooks: {
      hook: (name: string, fn: ErrorHook) => {
        if (name === "error") errorHook = fn;
      },
    },
  });
});

describe("server/plugins/error-logger", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("N-1: 5xx のエラーをメソッド・パス・スタックトレース付きで記録する", () => {
    const error = Object.assign(new Error("boom"), { statusCode: 503 });

    errorHook(error, { event: { method: "GET", path: "/api/spots" } });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[api] 503 GET /api/spots",
      error.stack,
    );
  });

  it("N-2: statusCode を持たない想定外の例外（DB エラー等）は 500 として記録する", () => {
    const error = new Error("DB connection failed");

    errorHook(error, { event: { method: "POST", path: "/api/spots" } });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[api] 500 POST /api/spots",
      error.stack,
    );
  });

  it.each([400, 401, 403, 404])(
    "S-1: 意図的な %i は業務上の正常系として記録しない",
    (statusCode) => {
      const error = Object.assign(new Error("client error"), { statusCode });

      errorHook(error, { event: { method: "GET", path: "/api/spots" } });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    },
  );

  it("S-2: event が無い場合は「(no event)」として記録する", () => {
    const error = new Error("startup failure");

    errorHook(error, {});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[api] 500 (no event)",
      error.stack,
    );
  });

  it("S-3: Error 以外の値が投げられた場合は値そのものを記録する", () => {
    errorHook("string thrown", {
      event: { method: "GET", path: "/api/spots" },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[api] 500 GET /api/spots",
      "string thrown",
    );
  });
});
