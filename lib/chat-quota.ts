import { sql } from "drizzle-orm";
import { getDb } from "@/src/db";

const DEFAULT_DAILY_CHAT_LIMIT = 20;
const DEFAULT_TIME_ZONE = "Asia/Shanghai";

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getDailyChatLimit() {
  return positiveInteger(
    process.env.CHAT_DAILY_LIMIT,
    DEFAULT_DAILY_CHAT_LIMIT,
  );
}

function getUsageDate(now = new Date()) {
  const timeZone = process.env.APP_TIME_ZONE?.trim() || DEFAULT_TIME_ZONE;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  return `${value("year")}-${value("month")}-${value("day")}`;
}

export async function consumeDailyChatQuota(userId: number) {
  const limit = getDailyChatLimit();
  const usageDate = getUsageDate();
  const result = await getDb().execute<{ chat_count: number }>(sql`
    INSERT INTO daily_chat_usage (user_id, usage_date, chat_count, updated_at)
    VALUES (${userId}, ${usageDate}, 1, NOW())
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET
      chat_count = daily_chat_usage.chat_count + 1,
      updated_at = NOW()
    WHERE daily_chat_usage.chat_count < ${limit}
    RETURNING chat_count
  `);
  const row = result.rows[0];

  return {
    allowed: Boolean(row),
    used: row?.chat_count ?? limit,
    limit,
    usageDate,
  };
}
