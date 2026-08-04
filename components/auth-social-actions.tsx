"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type SocialProvider = "google" | "github" | "passkey";

type AuthSocialActionsProps = {
  defaultCallbackURL: string;
  errorCallbackURL: string;
  disabled?: boolean;
  allowPasskey?: boolean;
  onError: (message: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  onPasskeySuccess?: () => void;
};

function providerName(provider: "google" | "github") {
  return provider === "google" ? "Google" : "GitHub";
}

function getCallbackURL(defaultCallbackURL: string) {
  if (typeof window === "undefined") return defaultCallbackURL;

  const requestedPath = new URLSearchParams(window.location.search).get("next");
  return requestedPath === "/admin" ? "/admin" : defaultCallbackURL;
}

export default function AuthSocialActions({
  defaultCallbackURL,
  errorCallbackURL,
  disabled = false,
  allowPasskey = true,
  onError,
  onLoadingChange,
  onPasskeySuccess,
}: AuthSocialActionsProps) {
  const [activeProvider, setActiveProvider] = useState<SocialProvider | null>(
    null,
  );

  function setLoading(provider: SocialProvider | null) {
    setActiveProvider(provider);
    onLoadingChange?.(provider !== null);
  }

  async function handleSocialSignIn(provider: "google" | "github") {
    if (disabled || activeProvider) return;

    onError("");
    setLoading(provider);

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: getCallbackURL(defaultCallbackURL),
        errorCallbackURL: `${errorCallbackURL}?error=${provider}`,
      });

      if (result?.error) {
        onError(
          result.error.message ||
            `${providerName(provider)} 登录暂时不可用，请稍后再试。`,
        );
        setLoading(null);
      }
    } catch {
      onError(`${providerName(provider)} 登录暂时不可用，请稍后再试。`);
      setLoading(null);
    }
  }

  async function handlePasskeySignIn() {
    if (disabled || activeProvider || !allowPasskey) return;

    onError("");
    setLoading("passkey");

    try {
      const result = await authClient.signIn.passkey();

      if (result.error) {
        onError(
          result.error.message ||
            "通行密钥登录没有完成，请确认此设备已经注册过通行密钥。",
        );
        setLoading(null);
        return;
      }

      onPasskeySuccess?.();
    } catch {
      onError("通行密钥登录没有完成，请稍后重试。");
      setLoading(null);
    }
  }

  const buttonsDisabled = disabled || activeProvider !== null;

  return (
    <>
      <div className="login-social-divider" aria-hidden="true">
        <span>或</span>
      </div>
      <div className="login-social-actions">
        <button
          className="login-social-button"
          type="button"
          onClick={() => void handleSocialSignIn("google")}
          disabled={buttonsDisabled}
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
            {activeProvider === "google" ? "正在前往..." : "Google"}
          </span>
        </button>
        <button
          className="login-social-button"
          type="button"
          onClick={() => void handleSocialSignIn("github")}
          disabled={buttonsDisabled}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.61-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.53 9.53 0 0 1 12 6.93c.85 0 1.71.12 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.65c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
            />
          </svg>
          <span>
            {activeProvider === "github" ? "正在前往..." : "GitHub"}
          </span>
        </button>
        <button
          className="login-social-button"
          type="button"
          onClick={() => void handlePasskeySignIn()}
          disabled={buttonsDisabled || !allowPasskey}
          title={
            allowPasskey
              ? undefined
              : "请先创建账号，再在账号安全页添加通行密钥。"
          }
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M7.5 14a5.5 5.5 0 1 1 4.79-2.8L22 11.2V15h-2.5v2.5H17V20h-4v-4.29A5.48 5.48 0 0 1 7.5 14Zm0-3A2.5 2.5 0 1 0 7.5 6a2.5 2.5 0 0 0 0 5Z"
            />
          </svg>
          <span>
            {activeProvider === "passkey"
              ? "正在验证..."
              : allowPasskey
                ? "通行密钥"
                : "注册后添加"}
          </span>
        </button>
      </div>
    </>
  );
}
