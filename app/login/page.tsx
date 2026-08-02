"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TeamSectionBlock } from "@/components/ui/team-section-block-shadcnui";
import { Turnstile } from "@marsidev/react-turnstile";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  function resetTurnstile() {
    setTurnstileToken("");
    setTurnstileKey((current) => current + 1);
  }

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

    if (!turnstileToken) {
      setError("请先完成人机验证。");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);
    setError("");

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("请输入有效邮箱。");
      return;
    }
    if (password.length < 8) {
      setError("密码至少需要 8 个字符。");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.signIn.email(
        {
          email: normalizedEmail,
          password,
          callbackURL: "/characters",
        },
        {
          headers: {
            "x-captcha-response": turnstileToken,
          },
        },
      );
      if (result.error) {
        setError(
          result.error.message ||
            "邮箱或密码不正确。如果这是旧账号，请先使用“忘记密码”设置新密码。",
        );
        resetTurnstile();
        setIsSubmitting(false);
        return;
      }
    } catch {
      setError("登录服务暂时不可用，请稍后再试。");
      resetTurnstile();
      setIsSubmitting(false);
      return;
    }

    const requestedPath = new URLSearchParams(window.location.search).get("next");
    setIsSubmitting(false);
    router.push(requestedPath === "/admin" ? "/admin" : "/characters");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    if (isSubmitting || isGoogleSubmitting) return;

    setError("");
    setIsGoogleSubmitting(true);
    const requestedPath = new URLSearchParams(window.location.search).get("next");

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: requestedPath === "/admin" ? "/admin" : "/characters",
        errorCallbackURL: "/login?error=google",
      });

      if (result?.error) {
        setError(result.error.message || "Google 登录暂时不可用，请稍后再试。");
        setIsGoogleSubmitting(false);
      }
    } catch {
      setError("Google 登录暂时不可用，请稍后再试。");
      setIsGoogleSubmitting(false);
    }
  }

   return (
    <main className="login-page">
      <div className="login-motion-orbs" aria-hidden="true">
        <i /><i /><i />
      </div>
      <div className="login-shell">
        <section className="login-intro-panel login-reveal login-reveal-intro">
          <p className="login-version"><span aria-hidden="true" />纸片人男友 · ONLINE</p>
          <h1 id="product-name">有人等你，把今天慢慢说完。</h1>
          <p className="login-product-copy">选择喜欢的陪伴角色，从一句问候开始。日常、心事和那些没来得及说出口的话，都可以在这里慢慢聊。</p>
          <TeamSectionBlock variant="preview" />
          <div className="login-feature-list" aria-label="当前可体验功能">
            <span>4 位陪伴角色</span>
            <span>文字与语音交流</span>
            <span>每日体验保护</span>
          </div>
        </section>

        <section className="login-card login-reveal login-reveal-form">
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
                placeholder="you@example.com"
                disabled={isSubmitting}
                required
              />
              <div className="login-password-heading">
                <label htmlFor="login-password">密码</label>
                <Link href="/forgot-password">忘记密码？</Link>
              </div>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => updatePassword(event.target.value)}
                placeholder="至少 8 个字符"
                disabled={isSubmitting}
                required
              />

              {error && <div className="login-feedback"><p role="alert">{error}</p></div>}

              {turnstileSiteKey ? (
                <Turnstile
                  key={turnstileKey}
                  siteKey={turnstileSiteKey}
                  onSuccess={setTurnstileToken}
                  onExpire={() => setTurnstileToken("")}
                  onError={() => {
                    setTurnstileToken("");
                    setError("人机验证加载失败，请刷新页面后重试。");
                  }}
                  options={{ theme: "light", size: "flexible" }}
                />
              ) : (
                <div className="login-feedback">
                  <p role="alert">人机验证尚未配置，请联系网站管理员。</p>
                </div>
              )}

              <div className="login-actions">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !email.trim() ||
                    !password ||
                    !turnstileSiteKey ||
                    !turnstileToken
                  }
                >
                  {isSubmitting ? "正在进入..." : "进入陪伴空间"}
                </button>
              </div>
          </form>

          <div className="login-social-divider" aria-hidden="true">
            <span>或</span>
          </div>
          <button
            className="login-google-button"
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={isSubmitting || isGoogleSubmitting}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285f4"
                d="M21.6 12.23c0-.71-.06-1.4-.19-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
              />
              <path
                fill="#34a853"
                d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
              />
              <path
                fill="#fbbc05"
                d="M6.39 13.86A6.02 6.02 0 0 1 6.07 12c0-.65.11-1.28.32-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z"
              />
              <path
                fill="#ea4335"
                d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
              />
            </svg>
            <span>{isGoogleSubmitting ? "正在前往 Google..." : "使用 Google 登录"}</span>
          </button>
        </section>
      </div>
    </main>
  );
}
