import { cookies } from "next/headers";

const ADMIN_COOKIE = "paper-boyfriend:admin";

function configuredAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "admin@example.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isConfiguredAdmin(email: string) {
  return configuredAdminEmails().includes(email.trim().toLowerCase());
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === "mock-admin";
}

export const adminSessionCookie = {
  name: ADMIN_COOKIE,
  value: "mock-admin",
};

