"use client";

import { ReactNode, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      window.location.replace("/login");
    }
  }, [isPending, session]);

  if (isPending || !session) {
    return (
      <main className="auth-check-page" aria-live="polite">
        正在检查登录状态…
      </main>
    );
  }

  return children;
}
