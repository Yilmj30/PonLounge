// Single source of truth for operating hours, reservation windows, and
// venue capacity — read by the local simulated DB, the real-Postgres seed
// script, and any UI copy that needs to stay in sync with them.

// Venue is open 4:00 p.m. to midnight.
export const VENUE_OPEN_TIME = "16:00";
export const VENUE_CLOSE_TIME = "00:00";

// Last reservation slot — walk-ins are still welcome after this, but the
// booking wizard stops offering slots past it.
export const LAST_RESERVATION_TIME = "21:00";

// Reduced initial capacity while the venue ramps up (previously modeled as
// 120 total). Applies per time slot, not across the whole night.
export const DEFAULT_SLOT_CAPACITY = 30;

// Self-service cancellation cutoff — matches the "cancelaciones flexibles
// hasta 2 horas antes" promise shown next to the reservation wizard. Closer
// to the reservation than this, self-cancel is blocked and the customer is
// pointed to WhatsApp/phone so staff can handle it directly.
export const CANCELLATION_CUTOFF_HOURS = 2;

function toMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Reservation slots every 30 minutes from open until the last reservation
// time (inclusive), e.g. 16:00, 16:30, ..., 21:00.
export const RESERVATION_SLOTS: string[] = (() => {
  const start = toMinutes(VENUE_OPEN_TIME);
  const end = toMinutes(LAST_RESERVATION_TIME);
  const slots: string[] = [];
  for (let t = start; t <= end; t += 30) {
    slots.push(toTimeString(t));
  }
  return slots;
})();

export const DEFAULT_SLOTS = RESERVATION_SLOTS.map((slotTime) => ({
  slotTime,
  capacity: DEFAULT_SLOT_CAPACITY,
}));
