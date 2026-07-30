import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getCurrentUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = Number(session?.user.id);
  return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
}
