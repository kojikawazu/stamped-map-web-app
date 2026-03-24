"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function LoginClient() {
  const router = useRouter();
  const { session, isLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session) {
      router.replace("/");
    }
  }, [isLoading, session, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setSubmitting(false);
      return;
    }

    toast.success("ログインしました");
    router.replace("/");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Stamped Map</h1>
          <p className="mt-2 text-sm text-zinc-500">
            アカウントにログインしてください
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="mail@example.com"
                disabled={submitting}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="パスワードを入力"
                disabled={submitting}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "ログイン中..." : "ログイン"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
