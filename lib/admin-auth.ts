import { auth } from "@/lib/auth";
import { headers } from "next/headers";

function configuredAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isConfiguredAdmin(email: string) {
  return configuredAdminEmails().includes(email.trim().toLowerCase());
}

export async function hasAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return Boolean(session?.user.email && isConfiguredAdmin(session.user.email));
}
