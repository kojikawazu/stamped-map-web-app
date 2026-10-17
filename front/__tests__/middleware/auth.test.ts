import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import type { RouteLocationNormalized } from "vue-router";
import authMiddleware from "../../middleware/auth";

// useSupabaseUser / navigateTo は auto-import の解決先を直接 import されるため、
// mockNuxtImport で解決先ごと差し替える（__tests__/repositories/api-client.test.ts と同じ理由）。
const { userRef, navigateToMock } = vi.hoisted(() => ({
  userRef: { value: null as { id: string } | null },
  navigateToMock: vi.fn((path: string) => path),
}));

mockNuxtImport("useSupabaseUser", () => () => userRef);
mockNuxtImport("navigateTo", () => navigateToMock);

// ミドルウェアは遷移元・遷移先を参照しないため、ルートは空のオブジェクトで足りる。
const route = {} as RouteLocationNormalized;

describe("middleware/auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userRef.value = null;
  });

  it("N-1: ログイン済みなら遷移させない", () => {
    userRef.value = { id: "user-1" };

    const result = authMiddleware(route, route);

    expect(result).toBeUndefined();
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("S-1: 未ログインなら /login へリダイレクトする", () => {
    const result = authMiddleware(route, route);

    expect(navigateToMock).toHaveBeenCalledWith("/login");
    expect(result).toBe("/login");
  });
});
