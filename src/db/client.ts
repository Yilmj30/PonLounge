import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazily constructed so importing this module (e.g. during `next build`'s
// route-data-collection pass, which evaluates route handler modules) never
// throws just because DATABASE_URL isn't set yet. The error only surfaces
// if a request actually tries to hit the database.
let cachedSql: NeonQueryFunction<false, false> | null = null;
let cachedDb: NeonHttpDatabase<typeof schema> | null = null;

function getConnectionString(): string {
  // Vercel's Postgres storage (Neon integration) injects DATABASE_URL. Some
  // older setups expose POSTGRES_URL instead — support both.
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "Missing DATABASE_URL (or POSTGRES_URL). Set it to your Neon connection " +
        "string in .env.local (local) or the hosting panel (production) — see README.",
    );
  }
  return connectionString;
}

// True when a real Postgres connection string is configured. Without one,
// the app falls back to the local JSON-file stores under .data/.
export function hasRemoteDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export function getSql(): NeonQueryFunction<false, false> {
  cachedSql ??= neon(getConnectionString());
  return cachedSql;
}

export function getDb(): NeonHttpDatabase<typeof schema> {
  cachedDb ??= drizzle(getSql(), { schema });
  return cachedDb;
}
