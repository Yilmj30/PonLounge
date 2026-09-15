import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getSql, getDb } from "./client";
import { slotCapacity } from "./schema";
import { DEFAULT_SLOTS } from "@/lib/hours";
import { seedMenuIfEmpty } from "./menuStore";

// Run once after `npm run db:migrate` to install the atomic booking function
// and seed the default time slots. Safe to re-run (idempotent): the
// function is CREATE OR REPLACE, and slot seeding upserts on conflict.

// Neon's HTTP driver runs one statement per query, so each SQL file is
// split on the same "--> statement-breakpoint" marker drizzle uses in its
// migrations.
async function runSqlFile(file: string) {
  const statements = readFileSync(file, "utf-8")
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await getSql().query(statement);
  }
}

async function main() {
  const db = getDb();

  const dir = path.dirname(fileURLToPath(import.meta.url));
  await runSqlFile(path.join(dir, "sql/book_reservation.sql"));
  console.log("✓ book_reservation() function installed");

  await runSqlFile(path.join(dir, "sql/approve_reject_deposit.sql"));
  console.log("✓ approve_deposit()/reject_deposit() functions installed");

  for (const slot of DEFAULT_SLOTS) {
    await db
      .insert(slotCapacity)
      .values(slot)
      .onConflictDoUpdate({
        target: slotCapacity.slotTime,
        set: { capacity: slot.capacity },
      });
  }
  console.log(`✓ Seeded ${DEFAULT_SLOTS.length} time slots`);

  const menuSeed = await seedMenuIfEmpty();
  console.log(
    menuSeed === "seeded"
      ? "✓ Menu copied from src/data/menu.ts"
      : "✓ Menu already in the database — left untouched",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
