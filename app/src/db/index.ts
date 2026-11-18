import "./env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");

const globalForDb = globalThis as unknown as {
  citywalkSql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDb.citywalkSql ??
  postgres(url, {
    max: 10,
    prepare: false,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") globalForDb.citywalkSql = sql;

export const db = drizzle(sql, { schema });
export { sql as client };
