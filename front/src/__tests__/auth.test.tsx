import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor, cleanup } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock sonner
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

// Supabase mock setup
let authStateCallback: ((event: string, session: unknown) => void) | null =
  null;
const mockGetSession = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    auth: {
      getSession: mockGetSession,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      onAuthStateChange: (
        cb: (event: string, session: unknown) => void
      ) => {
        authStateCallback = cb;
        return {
          data: {
            subscription: { unsubscribe: vi.fn() },
          },
        };
      },
    },
  }),
}));

// Helper component to observe auth context
function AuthConsumer() {
  const { user, session, isLoading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="session">{session ? "authenticated" : "none"}</span>
      <span data-testid="user">{user?.email ?? "none"}</span>
      <button
        data-testid="login-btn"
        onClick={() => login("test@example.com", "password")}
      />
      <button data-testid="logout-btn" onClick={logout} />
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  authStateCallback = null;
});

describe("AuthProvider", () => {
  describe("initialization", () => {
    it("resolves isLoading to false even when getSession rejects", async () => {
      mockGetSession.mockRejectedValueOnce(new Error("Network error"));

      renderWithAuth();

      // Initially loading
      expect(screen.getByTestId("loading").textContent).toBe("true");

      // After rejection, loading should resolve
      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });
      expect(screen.getByTestId("session").textContent).toBe("none");
    });

    it("sets session when getSession succeeds", async () => {
      const mockSession = {
        access_token: "token",
        user: { id: "1", email: "test@example.com" },
      };
      mockGetSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });
      expect(screen.getByTestId("session").textContent).toBe("authenticated");
      expect(screen.getByTestId("user").textContent).toBe("test@example.com");
    });
  });

  describe("login", () => {
    it("updates session via onAuthStateChange after successful login", async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
      });
      mockSignInWithPassword.mockResolvedValueOnce({ error: null });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });
      expect(screen.getByTestId("session").textContent).toBe("none");

      // Trigger login
      await act(async () => {
        screen.getByTestId("login-btn").click();
      });

      // Simulate onAuthStateChange firing after successful login
      const newSession = {
        access_token: "new-token",
        user: { id: "1", email: "test@example.com" },
      };
      act(() => {
        authStateCallback?.("SIGNED_IN", newSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId("session").textContent).toBe(
          "authenticated"
        );
      });
      expect(screen.getByTestId("user").textContent).toBe("test@example.com");
    });
  });

  describe("logout", () => {
    it("shows error toast and stays on page when signOut fails", async () => {
      const mockSession = {
        access_token: "token",
        user: { id: "1", email: "test@example.com" },
      };
      mockGetSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });
      mockSignOut.mockResolvedValueOnce({
        error: new Error("Sign out failed"),
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByTestId("session").textContent).toBe(
          "authenticated"
        );
      });

      // Trigger logout
      await act(async () => {
        screen.getByTestId("logout-btn").click();
      });

      // Should show error toast
      expect(mockToastError).toHaveBeenCalledWith(
        "ログアウトに失敗しました。もう一度お試しください。"
      );
      // Should NOT navigate
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("navigates to /login when signOut succeeds", async () => {
      const mockSession = {
        access_token: "token",
        user: { id: "1", email: "test@example.com" },
      };
      mockGetSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });
      mockSignOut.mockResolvedValueOnce({ error: null });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByTestId("session").textContent).toBe(
          "authenticated"
        );
      });

      await act(async () => {
        screen.getByTestId("logout-btn").click();
      });

      expect(mockPush).toHaveBeenCalledWith("/login");
      expect(mockToastError).not.toHaveBeenCalled();
    });
  });
});
