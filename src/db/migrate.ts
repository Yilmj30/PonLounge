import { fileURLToPath } from "node:url";
import path from "node:path";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { getDb } from "./client";

// Applies every pending migration in src/db/migrations (generated from
// schema.ts with `npm run db:generate`). Already-applied migrations are
// tracked by drizzle in the drizzle.__drizzle_migrations table, so this is
// safe to re-run. Follow with `npm run db:seed` to install the SQL
// functions and time slots — or just run `npm run db:setup` for both.
async function main() {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  await migrate(getDb(), { migrationsFolder: path.join(dir, "migrations") });
  console.log("✓ Migrations applied");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
