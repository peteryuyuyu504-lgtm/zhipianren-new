import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | undefined;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL 未配置，后台暂时无法读取数据库。");
  }

  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return drizzle(pool, { schema });
}

