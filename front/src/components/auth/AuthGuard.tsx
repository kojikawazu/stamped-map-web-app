"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
  }, [isLoading, session, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-600" />
          <p className="mt-4 text-sm text-zinc-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
