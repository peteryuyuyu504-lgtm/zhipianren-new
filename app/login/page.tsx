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
  const [activeSocialProvider, setActiveSocialProvider] = useState<
    "google" | "github" | "passkey" | null
  >(null);
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

  async function handleSocialSignIn(provider: "google" | "github") {
    if (isSubmitting || activeSocialProvider) return;

    setError("");
    setActiveSocialProvider(provider);
    const requestedPath = new URLSearchParams(window.location.search).get("next");

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: requestedPath === "/admin" ? "/admin" : "/characters",
        errorCallbackURL: `/login?error=${provider}`,
      });

      if (result?.error) {
        const providerName = provider === "google" ? "Google" : "GitHub";
        setError(
          result.error.message || `${providerName} 登录暂时不可用，请稍后再试。`,
        );
        setActiveSocialProvider(null);
      }
    } catch {
      const providerName = provider === "google" ? "Google" : "GitHub";
      setError(`${providerName} 登录暂时不可用，请稍后再试。`);
      setActiveSocialProvider(null);
    }
  }

  async function handlePasskeySignIn() {
    if (isSubmitting || activeSocialProvider) return;

    setError("");
    setActiveSocialProvider("passkey");

    try {
      const result = await authClient.signIn.passkey();

      if (result.error) {
        setError(
          result.error.message ||
            "通行密钥登录没有完成，请确认此设备已经注册过通行密钥。",
        );
        setActiveSocialProvider(null);
        return;
      }

      const requestedPath = new URLSearchParams(window.location.search).get(
        "next",
      );
      router.push(requestedPath === "/admin" ? "/admin" : "/characters");
      router.refresh();
    } catch {
      setError("通行密钥登录没有完成，请稍后重试。");
      setActiveSocialProvider(null);
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
          <div className="login-social-actions">
            <button
              className="login-social-button"
              type="button"
              onClick={() => void handleSocialSignIn("google")}
              disabled={isSubmitting || activeSocialProvider !== null}
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
              <span>
                {activeSocialProvider === "google" ? "正在前往..." : "Google"}
              </span>
            </button>
            <button
              className="login-social-button"
              type="button"
              onClick={() => void handleSocialSignIn("github")}
              disabled={isSubmitting || activeSocialProvider !== null}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.61-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.53 9.53 0 0 1 12 6.93c.85 0 1.71.12 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.65c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
                />
              </svg>
              <span>
                {activeSocialProvider === "github" ? "正在前往..." : "GitHub"}
              </span>
            </button>
            <button
              className="login-social-button"
              type="button"
              onClick={() => void handlePasskeySignIn()}
              disabled={isSubmitting || activeSocialProvider !== null}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M7.5 14a5.5 5.5 0 1 1 4.79-2.8L22 11.2V15h-2.5v2.5H17V20h-4v-4.29A5.48 5.48 0 0 1 7.5 14Zm0-3A2.5 2.5 0 1 0 7.5 6a2.5 2.5 0 0 0 0 5Z"
                />
              </svg>
              <span>
                {activeSocialProvider === "passkey"
                  ? "正在验证..."
                  : "通行密钥"}
              </span>
            </button>
          </div>
          <Link className="login-contact-link login-register-link" href="/register">
            <span className="login-link-copy">
              <span className="login-link-question">还没有账号？</span>
              <strong className="login-link-action">立即注册</strong>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link className="login-contact-link login-help-link" href="/contact">
            <span className="login-link-copy">
              <span className="login-link-question">遇到问题？</span>
              <strong className="login-link-action">联系我们</strong>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
