"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { validateMockLogin } from "@/lib/mock-login";
import { saveMockLogin } from "@/lib/mock-auth";
import { TeamSectionBlock } from "@/components/ui/team-section-block-shadcnui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 用户重新输入后清除旧错误，避免过期提示继续干扰当前操作。
  function updateEmail(value: string) {
    setEmail(value);
    if (error) setError("");
  }

  function updatePassword(value: string) {
    setPassword(value);
    if (error) setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const result = validateMockLogin(email, password);
    setEmail(result.email);
    setError("");

    if (!result.success && result.message === "密码至少需要 6 位") {
      setError(result.message);
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!result.success) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    if (!saveMockLogin()) {
      setError("浏览器无法保存登录状态，请允许本站使用本地存储。");
      setIsSubmitting(false);
      return;
    }
    const adminSessionResponse = await fetch("/api/auth/admin-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: result.email }),
    });
    const adminSession = (await adminSessionResponse.json()) as {
      isAdmin?: boolean;
      error?: string;
    };

    if (!adminSessionResponse.ok) {
      setError(adminSession.error || "登录服务暂时不可用，请稍后再试");
      setIsSubmitting(false);
      return;
    }

    const requestedPath = new URLSearchParams(window.location.search).get("next");
    if (requestedPath === "/admin" && !adminSession.isAdmin) {
      setError("这个邮箱不是管理员账号。请使用 admin@example.com 登录后台。");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.push(adminSession.isAdmin || requestedPath === "/admin" ? "/admin" : "/characters");
  }

  return (
    <main className="login-page">
      <div className="login-motion-orbs" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="login-shell">
        <section
          className="login-intro-panel login-reveal login-reveal-intro"
          aria-labelledby="product-name"
        >
          <p className="login-version"><span aria-hidden="true" />纸片人男友 · ONLINE</p>
          <h1 id="product-name">
            有人等你，
            <strong>把今天慢慢说完。</strong>
          </h1>
          <p className="login-product-copy">
            选择喜欢的陪伴角色，从一句问候开始。日常、心事和那些没来得及说出口的话，都可以在这里慢慢聊。
          </p>

          <TeamSectionBlock variant="preview" />

          <div className="login-feature-list" aria-label="当前可体验功能">
            <span>4 位陪伴角色</span>
            <span>文字与语音交流</span>
            <span>每日体验保护</span>
          </div>
        </section>

        <section
          className="login-card login-reveal login-reveal-form"
          aria-labelledby="login-title"
        >
          <div className="login-stage"><span aria-hidden="true" />陪伴空间已开启</div>

          <header className="login-heading">
            <p>欢迎回来</p>
            <h2 id="login-title">进入你的陪伴会话</h2>
            <span>使用邮箱登录，选择喜欢的角色，继续属于你们的对话。</span>
          </header>

          <form className="login-form" onSubmit={handleSubmit} noValidate autoComplete="off">
            <label htmlFor="login-email">邮箱</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => updateEmail(event.target.value)}
              onBlur={() => setEmail((current) => current.trim())}
              placeholder="you@example.com"
              disabled={isSubmitting}
              required
            />

            <label htmlFor="login-password">密码</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => updatePassword(event.target.value)}
              placeholder="至少 6 位"
              disabled={isSubmitting}
              required
            />

            <div className="login-feedback" aria-live="polite">
              {error && <p role="alert">{error}</p>}
            </div>

            <div className="login-actions">
              <button type="submit" disabled={isSubmitting || !email.trim() || !password}>
                {isSubmitting ? "正在进入…" : "进入陪伴空间"}
              </button>
            </div>
          </form>

          <aside className="login-assurance">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>安心聊天，从保护隐私开始</strong>
              <p>请勿在对话中发送密码、支付信息、身份证号等敏感内容。</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
