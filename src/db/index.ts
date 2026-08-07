import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { normalizeDatabaseUrlSslMode } from "./connection-string";

let pool: Pool | undefined;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL 未配置，后台暂时无法读取数据库。");
  }

  pool ??= new Pool({
    connectionString: normalizeDatabaseUrlSslMode(databaseUrl),
  });
  return drizzle(pool, { schema });
}
