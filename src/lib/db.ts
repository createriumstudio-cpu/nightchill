import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("DATABASE_URL not set — DB features disabled");
    return null;
  }
  return url;
};

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = getDatabaseUrl();
  if (!url) return null;
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export type Database = NonNullable<ReturnType<typeof getDb>>;
