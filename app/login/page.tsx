"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { validateMockLogin } from "@/lib/mock-login";
import { saveMockLogin } from "@/lib/mock-auth";

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

  // 当前仅在浏览器本地验证测试账号，不发送或保存任何账号信息。
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
      setError("浏览器无法保存 Mock 登录状态，请允许本站使用本地存储。");
      setIsSubmitting(false);
      return;
    }
    const adminSession = await fetch("/api/auth/admin-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: result.email }),
    }).then((response) => response.json() as Promise<{ isAdmin: boolean }>);

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
      <div className="login-shell">
        <section className="login-intro-panel" aria-labelledby="product-name">
          <p className="login-version">2.0 · 简装版</p>
          <h1 id="product-name">纸片人男友 <em>2.0</em></h1>
          <p className="login-product-copy">
            选一个懂你的他，<br />
            把今天没说出口的话，慢慢说完。
          </p>
          <div className="login-feature-list" aria-label="当前可体验功能">
            <span>邮箱登录入口</span>
            <span>4 位角色倾听者</span>
            <span>文字聊天闭环</span>
          </div>
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <div className="login-stage"><span aria-hidden="true" />开发阶段 · Mock 登录</div>

          <header className="login-heading">
            <p>登录 / 注册</p>
            <h2 id="login-title">进入你的陪伴会话</h2>
            <span>当前不会连接真实数据库，填写测试邮箱和至少 6 位密码即可继续。</span>
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
                {isSubmitting ? "正在验证…" : "登录"}
              </button>
              <button className="register-placeholder" type="button" disabled title="简装版暂未开放注册">
                注册
              </button>
            </div>
          </form>

          <aside className="login-mock-note">
            <strong>开发阶段说明</strong>
            <p>先用 Mock 登录和 Mock 聊天跑通完整体验。进入产品、选择倾听者，发出第一句话。</p>
            <p>不会保存真实邮箱、密码或任何密钥。</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
