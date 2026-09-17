// The venue's bookable spots: 6 tables plus the 4 bar stools. Seats per
// table aren't tracked — a reservation takes one spot, whatever the party
// size, and staff seats people as usual.
//
// This list is what `npm run db:seed` creates in the venue_spots table (and
// what the local file store starts from). Adding a spot here and re-running
// the seed adds it; renaming one only changes its label, never its id.

export type SpotKind = "mesa" | "barra";

export type VenueSpot = {
  id: string;
  label: string;
  kind: SpotKind;
  sortOrder: number;
  // Blocked by staff from /admin/mesas — e.g. a walk-in took the table.
  // It stays blocked (for every date) until someone unblocks it.
  blocked: boolean;
  blockedReason: string | null;
};

export const TABLE_COUNT = 6;
export const BAR_SEAT_COUNT = 4;

export const DEFAULT_SPOTS: Omit<VenueSpot, "blocked" | "blockedReason">[] = [
  ...Array.from({ length: TABLE_COUNT }, (_, i) => ({
    id: `mesa-${i + 1}`,
    label: `Mesa ${i + 1}`,
    kind: "mesa" as const,
    sortOrder: i,
  })),
  ...Array.from({ length: BAR_SEAT_COUNT }, (_, i) => ({
    id: `barra-${i + 1}`,
    label: `Barra ${i + 1}`,
    kind: "barra" as const,
    sortOrder: TABLE_COUNT + i,
  })),
];

export const TOTAL_SPOTS = DEFAULT_SPOTS.length;

export function freeSpotCount(spots: VenueSpot[]): number {
  return spots.filter((s) => !s.blocked).length;
}

// How many spots are still bookable for a date: everything not blocked,
// minus the reservations already confirmed for that day. A confirmed
// reservation holds its spot for the rest of the night, so the number is
// the same for every time slot of that date.
export function remainingSpots(
  spots: VenueSpot[],
  confirmedReservations: number,
): number {
  return Math.max(freeSpotCount(spots) - confirmedReservations, 0);
}
