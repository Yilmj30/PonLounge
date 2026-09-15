// Tracks which inbound-email webhook events have already been processed,
// so a retried delivery (Resend/Svix retries on timeout or a 5xx
// response) can't double-book or double-cancel a reservation. Backed by
// the processed_webhook_events Postgres table when DATABASE_URL is set,
// otherwise by a small local JSON file, same pattern as localStore.ts.
//
// Note: on a serverless deployment without a persistent filesystem (e.g.
// an early Vercel deploy without Postgres configured), the file-backed
// dedupe list resets on cold start — a very unlikely double-delivery
// could then slip through. Provision Postgres to rule that out.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb, hasRemoteDatabase } from "@/db/client";
import { processedWebhookEvents } from "@/db/schema";

const DATA_FILE = path.join(
  process.cwd(),
  ".data",
  "processed-webhook-events.json",
);

const MAX_TRACKED = 2000;

// No in-memory cache between calls — always read the file fresh, same
// reasoning as localStore.ts: avoids two route handlers (or two module
// instances under dev hot-reload) working from different in-memory
// snapshots until the server restarts.
function load(): string[] {
  try {
    const raw = readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(events: string[]) {
  try {
    mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(events), "utf-8");
  } catch (err) {
    console.warn(
      "Webhook dedupe store: couldn't persist to disk, continuing " +
        "in-memory for this instance only.",
      err,
    );
  }
}

export async function hasProcessedWebhookEvent(
  eventId: string,
): Promise<boolean> {
  if (hasRemoteDatabase()) {
    const rows = await getDb()
      .select({ eventId: processedWebhookEvents.eventId })
      .from(processedWebhookEvents)
      .where(eq(processedWebhookEvents.eventId, eventId))
      .limit(1);
    return rows.length > 0;
  }
  return load().includes(eventId);
}

export async function markWebhookEventProcessed(
  eventId: string,
): Promise<void> {
  if (hasRemoteDatabase()) {
    await getDb()
      .insert(processedWebhookEvents)
      .values({ eventId })
      .onConflictDoNothing();
    return;
  }

  const events = load();
  if (events.includes(eventId)) return;
  events.push(eventId);
  // Cap the list so it doesn't grow forever — only recent events matter
  // for retry dedupe purposes.
  if (events.length > MAX_TRACKED) {
    events.splice(0, events.length - MAX_TRACKED);
  }
  persist(events);
}

// Test-only: kept as a no-op for compatibility — there's no in-memory
// cache to reset anymore since load() always reads the file fresh.
export function __resetWebhookDedupeForTests() {}
