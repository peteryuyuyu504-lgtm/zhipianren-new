import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/src/db";
import * as schema from "@/src/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_PROTECTED_ENDPOINTS = [
  "/sign-in/email",
  "/sign-up/email",
  "/request-password-reset",
];
const TURNSTILE_MAX_ATTEMPTS = 3;
const TURNSTILE_TIMEOUT_MS = 10_000;

type TurnstileVerification = {
  success?: boolean;
  "error-codes"?: string[];
};

function middlewareError(message: string, code: string, status: number) {
  return {
    response: Response.json(
      {
        message,
        code,
      },
      { status }
    ),
  };
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function resilientTurnstile(secretKey: string): BetterAuthPlugin {
  return {
    id: "resilient-turnstile",
    onRequest: async (request, context) => {
      const url = new URL(request.url);
      const basePath = context.options.basePath ?? "/api/auth";
      let pathname = url.pathname.replace(basePath, "");

      if (pathname.endsWith("//")) pathname = pathname.slice(0, -1);
      if (pathname.startsWith("//")) pathname = pathname.slice(1);
      if (!pathname.startsWith("/")) pathname = `/${pathname}`;

      const isProtectedEndpoint = TURNSTILE_PROTECTED_ENDPOINTS.some(
        (endpoint) => pathname.includes(endpoint)
      );
      if (!isProtectedEndpoint) return;

      const captchaResponse = request.headers.get("x-captcha-response");
      if (!captchaResponse) {
        return middlewareError(
          "Missing CAPTCHA response",
          "MISSING_CAPTCHA_RESPONSE",
          400
        );
      }

      const idempotencyKey = crypto.randomUUID();

      for (let attempt = 1; attempt <= TURNSTILE_MAX_ATTEMPTS; attempt += 1) {
        try {
          const body = new URLSearchParams({
            secret: secretKey,
            response: captchaResponse,
            idempotency_key: idempotencyKey,
          });
          const response = await fetch(TURNSTILE_VERIFY_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
            signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS),
          });

          const verification =
            (await response.json()) as TurnstileVerification;
          const errorCodes = verification["error-codes"] ?? [];

          if (verification.success) return;

          if (errorCodes.includes("internal-error")) {
            console.warn(
              `Turnstile verification attempt ${attempt} returned internal-error`
            );
          } else {
            console.error("Turnstile verification rejected:", {
              httpStatus: response.status,
              errorCodes,
            });
            return middlewareError(
              "Captcha verification failed",
              "CAPTCHA_VERIFICATION_FAILED",
              403
            );
          }
        } catch (error) {
          console.warn(
            `Turnstile verification attempt ${attempt} failed:`,
            error instanceof Error ? error.message : "Unknown error"
          );
        }

        if (attempt < TURNSTILE_MAX_ATTEMPTS) {
          await delay(attempt * 300);
        }
      }

      console.error("Turnstile verification unavailable after retries");
      return middlewareError(
        "Captcha service temporarily unavailable",
        "CAPTCHA_SERVICE_UNAVAILABLE",
        503
      );
    },
  };
}

const turnstileSecret = process.env.TURNSTILE_SECRET_KEY?.trim();
const vercelPreviewURL =
  process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;
const configuredBaseURL =
  process.env.BETTER_AUTH_URL?.trim() ||
  vercelPreviewURL ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const auth = betterAuth({
  appName: "纸片人男友",
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema,
  }),
  secret:
    process.env.BETTER_AUTH_SECRET?.trim() ||
    process.env.AUTH_SESSION_SECRET?.trim(),
  baseURL: configuredBaseURL,
  user: {
    modelName: "users",
    fields: {
      name: "username",
    },
  },
  session: {
    modelName: "authSessions",
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  account: {
    modelName: "authAccounts",
  },
  verification: {
    modelName: "authVerifications",
  },
  advanced: {
    database: {
      generateId: "serial",
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    password: {
      hash: hashPassword,
      verify: ({ hash, password }) => verifyPassword(password, hash),
    },
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
    resetPasswordTokenExpiresIn: 60 * 30,
    revokeSessionsOnPasswordReset: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await sendWelcomeEmail(user.email, user.name);
          } catch (error) {
            console.error("欢迎邮件发送失败：", error);
          }
        },
      },
    },
  },
  plugins: turnstileSecret
    ? [resilientTurnstile(turnstileSecret)]
    : [],
});
