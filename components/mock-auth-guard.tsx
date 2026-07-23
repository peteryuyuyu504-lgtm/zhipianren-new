"use client";

import { ReactNode, useEffect, useState } from "react";
import { hasMockLogin } from "@/lib/mock-auth";

export default function MockAuthGuard({ children }: { children: ReactNode }) {
  const [isAllowed, setIsAllowed] = useState(false);

  // 这是开发阶段的浏览器门禁，不具备真实服务端认证的安全能力。
  useEffect(() => {
    if (!hasMockLogin()) {
      window.location.replace("/");
      return;
    }

    const checkTimer = window.setTimeout(() => {
      setIsAllowed(true);
    }, 0);

    return () => window.clearTimeout(checkTimer);
  }, []);

  if (!isAllowed) {
    return (
      <main className="auth-check-page" aria-live="polite">
        正在检查 Mock 登录状态…
      </main>
    );
  }

  return children;
}
