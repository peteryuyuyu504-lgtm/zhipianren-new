"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!token) {
      setIsError(true);
      setFeedback("重置链接缺少令牌，请重新申请。");
      return;
    }
    if (password.length < 8) {
      setIsError(true);
      setFeedback("新密码至少需要 8 个字符。");
      return;
    }
    if (password !== confirmPassword) {
      setIsError(true);
      setFeedback("两次输入的密码不一致。");
      return;
    }

    setIsSubmitting(true);
    setFeedback("");
    try {
      const result = await authClient.resetPassword({
        token,
        newPassword: password,
      });
      setIsError(Boolean(result.error));
      setIsComplete(!result.error);
      setFeedback(
        result.error
          ? result.error.message || "密码重置失败，请重新申请。"
          : "密码已经更新。",
      );
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
        <div className="auth-letter-mark auth-key-mark" aria-hidden="true">
          <span />
          <svg viewBox="0 0 24 24">
            <path d="M15.5 7.5a5 5 0 1 1-1.45 3.53L21 4.08M18 7l2 2M15.5 9.5l2 2" />
          </svg>
        </div>
        <p className="auth-recovery-eyebrow">NEW PASSWORD</p>
        <h1>设置新密码</h1>
        <p className="auth-recovery-copy">
          使用至少 8 个字符。设置成功后，这封邮件里的链接将立即失效。
        </p>

        {!isComplete ? (
          <form className="auth-recovery-form" onSubmit={handleSubmit}>
            <label htmlFor="new-password">新密码</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 8 个字符"
              autoComplete="new-password"
              required
            />
            <label htmlFor="confirm-password">再次输入新密码</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="确认新密码"
              autoComplete="new-password"
              required
            />

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
                isSubmitting ||
                !token ||
                password.length < 8 ||
                !confirmPassword
              }
            >
              {isSubmitting ? "正在更新..." : "保存新密码"}
            </button>
          </form>
        ) : (
          <div className="auth-recovery-success" role="status">
            <strong>密码已经更新</strong>
            <p>{feedback}</p>
            <Link href="/login">使用新密码登录</Link>
          </div>
        )}

        {!isComplete && (
          <p className="auth-recovery-return">
            链接失效了？ <Link href="/forgot-password">重新申请</Link>
          </p>
        )}
      </section>
    </main>
  );
}
