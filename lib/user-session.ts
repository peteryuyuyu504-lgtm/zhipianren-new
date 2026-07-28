import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const USER_SESSION_COOKIE = "paper-boyfriend:user";
const DEVELOPMENT_SECRET = "paper-boyfriend-local-development-only";

function getSessionSecret() {
  const configured = process.env.AUTH_SESSION_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") return DEVELOPMENT_SECRET;
  throw new Error("AUTH_SESSION_SECRET is required in production");
}

function signUserId(userId: number) {
  return createHmac("sha256", getSessionSecret())
    .update(String(userId))
    .digest("base64url");
}

function verifySignature(userId: string, signature: string) {
  const expected = Buffer.from(
    createHmac("sha256", getSessionSecret())
      .update(userId)
      .digest("base64url"),
  );
  const received = Buffer.from(signature);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export function createUserSessionValue(userId: number) {
  return `${userId}.${signUserId(userId)}`;
}

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(USER_SESSION_COOKIE)?.value;
  if (!value) return null;

  const [rawUserId, signature] = value.split(".");
  const userId = Number(rawUserId);
  if (
    !rawUserId ||
    !signature ||
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    !verifySignature(rawUserId, signature)
  ) {
    return null;
  }

  return userId;
}

export const userSessionCookie = {
  name: USER_SESSION_COOKIE,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  },
};
