import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { captcha } from "better-auth/plugins";
import { getDb } from "@/src/db";
import * as schema from "@/src/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";

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
    ? [
        captcha({
          provider: "cloudflare-turnstile",
          secretKey: turnstileSecret,
          endpoints: [
            "/sign-in/email",
            "/sign-up/email",
            "/request-password-reset",
          ],
        }),
      ]
    : [],
});
