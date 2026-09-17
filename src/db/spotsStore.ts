// Venue spots (6 tables + 4 bar stools) and their blocked/unblocked state.
//
// Same two-backend pattern as the rest: real Postgres when DATABASE_URL is
// set, otherwise a local JSON file under .data/ so everything works before
// the database is provisioned.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import { getDb, hasRemoteDatabase } from "@/db/client";
import { venueSpots } from "@/db/schema";
import { DEFAULT_SPOTS, type VenueSpot } from "@/lib/spots";

export type SetBlockedResult =
  { status: "ok"; spot: VenueSpot } | { status: "not_found" };

// --- Local file backend ---

function dataDir(): string {
  return process.env.PON_LOCAL_DATA_DIR ?? path.join(process.cwd(), ".data");
}

function dataFile(): string {
  return path.join(dataDir(), "local-spots.json");
}

function defaultSpots(): VenueSpot[] {
  return DEFAULT_SPOTS.map((s) => ({
    ...s,
    blocked: false,
    blockedReason: null,
  }));
}

function loadLocal(): VenueSpot[] {
  let stored: VenueSpot[] = [];
  try {
    stored = JSON.parse(readFileSync(dataFile(), "utf-8")) as VenueSpot[];
  } catch {
    return defaultSpots();
  }
  // Spots added to DEFAULT_SPOTS later show up without losing stored state.
  const byId = new Map(stored.map((s) => [s.id, s]));
  return defaultSpots().map((s) => ({ ...s, ...byId.get(s.id) }));
}

function persistLocal(spots: VenueSpot[]) {
  mkdirSync(dataDir(), { recursive: true });
  writeFileSync(dataFile(), JSON.stringify(spots, null, 2), "utf-8");
}

// --- Public API ---

export async function getSpots(): Promise<VenueSpot[]> {
  if (!hasRemoteDatabase()) {
    return loadLocal().sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const rows = await getDb()
    .select()
    .from(venueSpots)
    .orderBy(asc(venueSpots.sortOrder));

  // Empty table (seed not run yet) — fall back to the default layout so the
  // panel and the booking flow still work.
  if (rows.length === 0) return defaultSpots();

  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    kind: r.kind,
    sortOrder: r.sortOrder,
    blocked: r.blocked,
    blockedReason: r.blockedReason,
  }));
}

export async function setSpotBlocked(
  id: string,
  blocked: boolean,
  reason: string | null,
): Promise<SetBlockedResult> {
  if (!hasRemoteDatabase()) {
    const spots = loadLocal();
    const spot = spots.find((s) => s.id === id);
    if (!spot) return { status: "not_found" };
    spot.blocked = blocked;
    spot.blockedReason = blocked ? reason : null;
    persistLocal(spots);
    return { status: "ok", spot };
  }

  const [row] = await getDb()
    .update(venueSpots)
    .set({
      blocked,
      blockedReason: blocked ? reason : null,
      blockedAt: blocked ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(venueSpots.id, id))
    .returning();
  if (!row) return { status: "not_found" };

  return {
    status: "ok",
    spot: {
      id: row.id,
      label: row.label,
      kind: row.kind,
      sortOrder: row.sortOrder,
      blocked: row.blocked,
      blockedReason: row.blockedReason,
    },
  };
}

// Creates any spot from DEFAULT_SPOTS that isn't in the database yet, and
// refreshes labels. Never touches the blocked state of existing rows, so
// re-running `npm run db:seed` can't accidentally free a blocked table.
export async function seedSpots(): Promise<number> {
  const db = getDb();
  for (const spot of DEFAULT_SPOTS) {
    await db
      .insert(venueSpots)
      .values(spot)
      .onConflictDoUpdate({
        target: venueSpots.id,
        set: { label: spot.label, sortOrder: spot.sortOrder },
      });
  }
  return DEFAULT_SPOTS.length;
}
