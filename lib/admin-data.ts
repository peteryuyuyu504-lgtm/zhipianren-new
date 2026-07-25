import { count, ilike, or } from "drizzle-orm";
import { getDb } from "@/src/db";
import { users } from "@/src/db/schema";

export const ADMIN_PAGE_SIZE = 10;

export type AdminUser = typeof users.$inferSelect;

export async function getUserCount() {
  const db = getDb();
  const [result] = await db.select({ value: count() }).from(users);
  return result.value;
}

export async function getUsersPage(query: string, requestedPage: number) {
  const db = getDb();
  const search = query.trim();
  const where = search
    ? or(ilike(users.username, `%${search}%`), ilike(users.email, `%${search}%`))
    : undefined;

  const [countResult] = await db.select({ value: count() }).from(users).where(where);
  const total = countResult.value;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const items = await db
    .select()
    .from(users)
    .where(where)
    .orderBy(users.id)
    .limit(ADMIN_PAGE_SIZE)
    .offset((page - 1) * ADMIN_PAGE_SIZE);

  return { items, page, total, totalPages };
}

