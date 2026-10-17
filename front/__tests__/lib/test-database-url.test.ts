import { describe, it, expect } from "vitest";
import {
  assertLocalDatabaseUrl,
  resolveTestDatabaseUrl,
} from "../../lib/test-database-url";

const DEFAULT_URL = "postgresql://stamped:stamped@localhost:5433/stamped";
const PROD_URL =
  "postgresql://postgres.ref:secret-pass@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

describe("resolveTestDatabaseUrl", () => {
  it("N-1: TEST_DATABASE_URL 未設定なら既定のローカル compose DB を返す", () => {
    expect(resolveTestDatabaseUrl({})).toBe(DEFAULT_URL);
  });

  it("N-2: TEST_DATABASE_URL が localhost を指していればその値を返す", () => {
    const url = "postgresql://postgres:postgres@localhost:5432/stamped_e2e";
    expect(resolveTestDatabaseUrl({ TEST_DATABASE_URL: url })).toBe(url);
  });

  it("S-1: DATABASE_URL が本番を指していても無視して既定値を返す（.env 汚染への耐性）", () => {
    expect(
      resolveTestDatabaseUrl({ DATABASE_URL: PROD_URL, DIRECT_URL: PROD_URL }),
    ).toBe(DEFAULT_URL);
  });

  it("S-2: TEST_DATABASE_URL が空文字なら未設定とみなし既定値を返す", () => {
    expect(resolveTestDatabaseUrl({ TEST_DATABASE_URL: "" })).toBe(DEFAULT_URL);
  });

  it("A-1: TEST_DATABASE_URL がリモートを指していれば throw する", () => {
    expect(() =>
      resolveTestDatabaseUrl({ TEST_DATABASE_URL: PROD_URL }),
    ).toThrow(/aws-1-ap-northeast-1\.pooler\.supabase\.com/);
  });
});

describe("assertLocalDatabaseUrl", () => {
  it.each([
    ["localhost", "postgresql://u:p@localhost:5433/db"],
    ["127.0.0.1", "postgresql://u:p@127.0.0.1:5432/db"],
    ["::1", "postgresql://u:p@[::1]:5432/db"],
    ["大文字の LOCALHOST", "postgresql://u:p@LOCALHOST:5432/db"],
  ])("N-1: %s は許可して URL をそのまま返す", (_label, url) => {
    expect(assertLocalDatabaseUrl(url)).toBe(url);
  });

  it("N-2: host 以外のクエリパラメータ（schema 等）は許可する", () => {
    const url = "postgresql://u:p@localhost:5433/db?schema=public";
    expect(assertLocalDatabaseUrl(url)).toBe(url);
  });

  it("A-1: Supabase の本番ホストは拒否する", () => {
    expect(() => assertLocalDatabaseUrl(PROD_URL)).toThrow(
      /aws-1-ap-northeast-1\.pooler\.supabase\.com/,
    );
  });

  it("A-2: localhost を接頭辞に持つだけのホストは拒否する", () => {
    expect(() =>
      assertLocalDatabaseUrl("postgresql://u:p@localhost.evil.example:5432/db"),
    ).toThrow(/localhost\.evil\.example/);
  });

  it.each(["host", "hostaddr"])(
    "A-3: クエリパラメータ %s で接続先を上書きする URL は拒否する",
    (param) => {
      expect(() =>
        assertLocalDatabaseUrl(
          `postgresql://u:p@localhost:5432/db?${param}=db.example.supabase.co`,
        ),
      ).toThrow(new RegExp(`${param}=`));
    },
  );

  it("A-4: 失敗メッセージに復旧手順（起動コマンドと既定 URL）を含め、パスワードは含めない", () => {
    let caught: unknown;
    try {
      assertLocalDatabaseUrl(PROD_URL);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    const message = caught instanceof Error ? caught.message : "";
    expect(message).toContain("make db-up");
    expect(message).toContain("TEST_DATABASE_URL");
    expect(message).toContain(DEFAULT_URL);
    expect(message).not.toContain("secret-pass");
  });

  it("A-5: URL として解析できない値は拒否し、値そのものはメッセージに含めない", () => {
    expect(() => assertLocalDatabaseUrl("not a url secret-pass")).toThrow(
      /解析できません/,
    );
    expect(() => assertLocalDatabaseUrl("not a url secret-pass")).not.toThrow(
      /secret-pass/,
    );
  });
});
