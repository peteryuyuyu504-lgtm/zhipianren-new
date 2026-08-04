"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import { TeamSectionBlock } from "@/components/ui/team-section-block-shadcnui";
import AuthSocialActions from "@/components/auth-social-actions";
import { authClient } from "@/lib/auth-client";

type RegistrationField = "email" | "nickname" | "password" | "confirmPassword";
type FieldErrors = Partial<Record<RegistrationField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getFallbackName(email: string) {
  const localPart = email.split("@")[0]?.trim() || "陪伴用户";
  return localPart.slice(0, 50);
}

function getRegistrationError(error: { code?: string; message?: string }) {
  switch (error.code) {
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "这个邮箱已经注册过了，请直接登录或换一个邮箱。";
    case "INVALID_EMAIL":
      return "请输入有效邮箱。";
    case "PASSWORD_TOO_SHORT":
      return "密码至少需要 8 个字符。";
    case "PASSWORD_TOO_LONG":
      return "密码不能超过 128 个字符。";
    case "EMAIL_PASSWORD_SIGN_UP_DISABLED":
      return "邮箱注册暂时不可用，请稍后再试。";
    default:
      return "注册暂时没有完成，请检查信息后重试。";
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isBusy = isSubmitting || isSocialSubmitting;

  function resetTurnstile() {
    setTurnstileToken("");
    setTurnstileKey((current) => current + 1);
  }

  function clearFieldError(field: RegistrationField) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError("");
  }

  function updateEmail(value: string) {
    setEmail(value);
    clearFieldError("email");
  }

  function updateNickname(value: string) {
    setNickname(value);
    clearFieldError("nickname");
  }

  function updatePassword(value: string) {
    setPassword(value);
    clearFieldError("password");
  }

  function updateConfirmPassword(value: string) {
    setConfirmPassword(value);
    clearFieldError("confirmPassword");
  }

  function clearSensitiveFields() {
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedNickname = nickname.trim();
    const nextErrors: FieldErrors = {};

    setEmail(normalizedEmail);
    setNickname(normalizedNickname);
    setFieldErrors({});
    setFormError("");

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = "请输入有效邮箱。";
    }
    if (normalizedNickname.length > 50) {
      nextErrors.nickname = "昵称不能超过 50 个字符。";
    }
    if (password.length < 8) {
      nextErrors.password = "密码至少需要 8 个字符。";
    } else if (password.length > 128) {
      nextErrors.password = "密码不能超过 128 个字符。";
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "两次输入的密码不一致。";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    if (!turnstileSiteKey) {
      setFormError("人机验证尚未配置，请联系网站管理员。");
      return;
    }
    if (!turnstileToken) {
      setFormError("请先完成人机验证。");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.signUp.email(
        {
          name: normalizedNickname || getFallbackName(normalizedEmail),
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
        const message = getRegistrationError(result.error);
        if (result.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
          setFieldErrors({ email: message });
        } else {
          setFormError(message);
        }
        clearSensitiveFields();
        resetTurnstile();
        return;
      }

      router.push("/characters");
      router.refresh();
    } catch {
      setFormError("注册服务暂时不可用，请稍后再试。");
      clearSensitiveFields();
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page register-page">
      <div className="login-motion-orbs" aria-hidden="true">
        <i /><i /><i />
      </div>
      <div className="login-shell">
        <section className="login-intro-panel login-reveal login-reveal-intro">
          <p className="login-version"><span aria-hidden="true" />纸片人男友 · ONLINE</p>
          <h1 id="product-name">从一句问候，开始你的陪伴。</h1>
          <p className="login-product-copy">创建一个属于你的陪伴空间。留下一个邮箱，选择一个称呼，之后每次回来，都能接着聊下去。</p>
          <TeamSectionBlock variant="preview" />
          <div className="login-feature-list" aria-label="注册后可体验功能">
            <span>4 位陪伴角色</span>
            <span>文字与语音交流</span>
            <span>每日体验保护</span>
          </div>
        </section>

        <section className="login-card login-reveal login-reveal-form">
          <div className="login-stage"><span aria-hidden="true" />陪伴空间已开启</div>
          <header className="login-heading">
            <p>创建你的空间</p>
            <h2 id="register-title">和喜欢的角色见面</h2>
            <span>注册后即可选择角色，把想说的话慢慢留下。</span>
          </header>

          <form
            className="login-form register-form"
            onSubmit={handleSubmit}
            noValidate
            autoComplete="on"
            aria-labelledby="register-title"
          >
            <div className="register-field">
              <label htmlFor="register-email">邮箱</label>
              <input
                id="register-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => updateEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isBusy}
                required
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
              />
              {fieldErrors.email && (
                <p className="register-field-error" id="register-email-error" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="register-field">
              <label htmlFor="register-nickname">昵称 <span>可选</span></label>
              <input
                id="register-nickname"
                name="nickname"
                type="text"
                value={nickname}
                onChange={(event) => updateNickname(event.target.value)}
                placeholder="给自己留一个称呼"
                autoComplete="nickname"
                maxLength={50}
                disabled={isBusy}
                aria-invalid={Boolean(fieldErrors.nickname)}
                aria-describedby={fieldErrors.nickname ? "register-nickname-error" : undefined}
              />
              {fieldErrors.nickname && (
                <p className="register-field-error" id="register-nickname-error" role="alert">
                  {fieldErrors.nickname}
                </p>
              )}
            </div>

            <div className="register-field">
              <label htmlFor="register-password">密码</label>
              <input
                id="register-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => updatePassword(event.target.value)}
                placeholder="至少 8 个字符"
                autoComplete="new-password"
                disabled={isBusy}
                required
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "register-password-error" : undefined}
              />
              {fieldErrors.password && (
                <p className="register-field-error" id="register-password-error" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="register-field">
              <label htmlFor="register-confirm-password">确认密码</label>
              <input
                id="register-confirm-password"
                name="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => updateConfirmPassword(event.target.value)}
                placeholder="再输入一次密码"
                autoComplete="new-password"
                disabled={isBusy}
                required
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? "register-confirm-password-error" : undefined}
              />
              {fieldErrors.confirmPassword && (
                <p className="register-field-error" id="register-confirm-password-error" role="alert">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <div className="register-turnstile">
              <p className="register-captcha-label">安全验证</p>
              {turnstileSiteKey ? (
                <Turnstile
                  key={turnstileKey}
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setFormError("");
                  }}
                  onExpire={() => {
                    setTurnstileToken("");
                    setFormError("人机验证已过期，请重新完成验证。");
                  }}
                  onError={() => {
                    setTurnstileToken("");
                    setFormError("人机验证加载失败，请刷新页面后重试。");
                  }}
                  options={{ theme: "light", size: "flexible" }}
                />
              ) : (
                <p className="login-feedback" role="alert">
                  人机验证尚未配置，请联系网站管理员。
                </p>
              )}
            </div>

            {formError && (
              <div className="login-feedback register-form-feedback">
                <p role="alert">{formError}</p>
              </div>
            )}

            <div className="login-actions">
              <button
                type="submit"
                disabled={
                  isBusy ||
                  !email.trim() ||
                  !password ||
                  !confirmPassword ||
                  !turnstileSiteKey ||
                  !turnstileToken
                }
              >
                {isSubmitting ? "正在创建..." : "创建账号"}
              </button>
            </div>
          </form>

          <AuthSocialActions
            defaultCallbackURL="/characters"
            errorCallbackURL="/register"
            disabled={isSubmitting}
            allowPasskey={false}
            onError={setFormError}
            onLoadingChange={setIsSocialSubmitting}
          />
          <p className="register-social-note">通行密钥可在创建账号后，于账号安全页添加。</p>
          <Link className="login-contact-link register-return-link" href="/login">
            <span>已有账号？去登录</span>
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
