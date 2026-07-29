"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!turnstileToken) {
      setIsError(true);
      setFeedback("请先完成人机验证。");
      return;
    }

    setIsSubmitting(true);
    setFeedback("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };
      setIsError(!response.ok);
      setFeedback(
        response.ok
          ? result.message || "重置邮件已发送，请检查收件箱。"
          : result.error || "暂时无法发送重置邮件，请稍后再试。",
      );
      if (!response.ok) {
        setTurnstileToken("");
        setTurnstileKey((current) => current + 1);
      }
    } catch {
      setIsError(true);
      setFeedback("网络连接失败，请稍后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-recovery-page">
      <div className="auth-recovery-glow" aria-hidden="true" />
      <section className="auth-recovery-card">
        <div className="auth-letter-mark" aria-hidden="true">
          <span />
          <svg viewBox="0 0 24 24">
            <path d="M3 6.75 12 13l9-6.25M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
          </svg>
        </div>
        <p className="auth-recovery-eyebrow">ACCOUNT RECOVERY</p>
        <h1>找回密码</h1>
        <p className="auth-recovery-copy">
          输入注册邮箱，我们会寄出一封仅在 30 分钟内有效的重置邮件。
        </p>

        <form className="auth-recovery-form" onSubmit={handleSubmit}>
          <label htmlFor="recovery-email">邮箱</label>
          <input
            id="recovery-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (feedback) setFeedback("");
            }}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          {siteKey ? (
            <Turnstile
              key={turnstileKey}
              siteKey={siteKey}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken("")}
              onError={() => {
                setTurnstileToken("");
                setIsError(true);
                setFeedback("人机验证加载失败，请刷新页面重试。");
              }}
              options={{ theme: "light", size: "flexible" }}
            />
          ) : (
            <p className="auth-recovery-feedback is-error">
              人机验证尚未配置。
            </p>
          )}

          {feedback && (
            <p
              className={`auth-recovery-feedback${isError ? " is-error" : ""}`}
              role={isError ? "alert" : "status"}
            >
              {feedback}
            </p>
          )}

          <button
            type="submit"
            disabled={
              isSubmitting || !email.trim() || !siteKey || !turnstileToken
            }
          >
            {isSubmitting ? "正在寄出..." : "发送重置邮件"}
          </button>
        </form>

        <p className="auth-recovery-return">
          想起来了？ <Link href="/login">返回登录</Link>
        </p>
      </section>
    </main>
  );
}
