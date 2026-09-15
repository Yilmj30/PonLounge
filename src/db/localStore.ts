// Local, file-simulated database for reservations. Used automatically
// whenever DATABASE_URL/POSTGRES_URL isn't set (see reservationsStore.ts),
// so the wizard can book automatically before real Postgres is provisioned
// — no cloud setup required for local development or an early launch.
//
// Data lives in a JSON file under .data/ (gitignored) so it survives dev
// server restarts. Writes are best-effort: on a read-only filesystem (e.g.
// a serverless cold start) they're caught and the store keeps working
// in-memory for the lifetime of that instance instead of crashing.
//
// Deposit verification flow: there's no payment gateway wired up yet, so
// a reservation with a reported deposit starts as "pending_deposit" — it
// does NOT count against slot capacity while pending, so it can't block
// other customers from booking that same time. Staff reviews it on the
// /admin panel and either approves it (re-checking capacity at that
// moment, since it wasn't held) or rejects it. Only "confirmed"
// reservations count toward capacity.

import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_SLOTS } from "@/lib/hours";
import { isPastCancellationCutoff } from "@/lib/reservation";

type ReservationStatus = "confirmed" | "pending_deposit" | "cancelled";
export type ReservationSource = "web" | "email";
export type ReservationLang = "es" | "en";
type CancellationReason = "customer" | "deposit_rejected";

type LocalReservation = {
  id: string;
  confirmationCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  occasion: string | null;
  notes: string | null;
  status: ReservationStatus;
  depositRequired: number;
  depositAmount: number;
  depositReference: string | null;
  depositVerified: boolean;
  source: ReservationSource;
  lang: ReservationLang;
  cancellationReason: CancellationReason | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
};

type LocalSlot = { slotTime: string; capacity: number };

type StoreData = {
  slots: LocalSlot[];
  reservations: LocalReservation[];
};

export type BookResult = {
  id: string | null;
  code: string | null;
  status:
    | "confirmed"
    | "pending_deposit"
    | "full"
    | "unknown_slot"
    | "invalid_party_size"
    | "deposit_too_low";
  remaining: number | null;
  depositRequired: number | null;
};

export type ReservationSummary = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  partySize: number;
  date: string;
  time: string;
  occasion: string | null;
  notes: string | null;
  status: ReservationStatus;
  depositRequired: number;
  depositAmount: number;
  depositReference: string | null;
  depositVerified: boolean;
  source: ReservationSource;
  lang: ReservationLang;
};

export type CancelResult = {
  status: "cancelled" | "not_found" | "already_cancelled" | "too_late";
  name?: string;
  email?: string | null;
  date?: string;
  time?: string;
  partySize?: number;
};

export type ApproveDepositResult = {
  status: "confirmed" | "not_found" | "not_pending" | "full";
  reservation?: ReservationSummary;
};

export type RejectDepositResult = {
  status: "rejected" | "not_found" | "not_pending";
  reservation?: ReservationSummary;
};

const DATA_FILE = path.join(process.cwd(), ".data", "local-reservations.json");

let persistenceWarned = false;

function defaultData(): StoreData {
  return { slots: DEFAULT_SLOTS.map((s) => ({ ...s })), reservations: [] };
}

// Generates a short, human-typeable confirmation code like "PON-A3F9K2".
function generateCodeCandidate(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `PON-${code}`;
}

// Keeps generating candidates until one doesn't collide with an existing
// reservation's code (checked against *all* reservations, including
// cancelled ones, so a cancelled reservation's code can never be reissued
// to someone else).
function generateConfirmationCode(data: StoreData): string {
  let code = generateCodeCandidate();
  let attempts = 0;
  while (
    data.reservations.some(
      (r) => r.confirmationCode.toUpperCase() === code.toUpperCase(),
    )
  ) {
    code = generateCodeCandidate();
    attempts += 1;
    if (attempts > 20) {
      throw new Error(
        "Couldn't generate a unique confirmation code after 20 attempts",
      );
    }
  }
  return code;
}

// No in-memory cache between calls — always read the file fresh and
// write it back immediately. At this venue's scale the extra disk
// read/write per request is free, and it rules out an entire class of
// staleness bugs from two route handlers (or two module instances under
// dev hot-reload) working from different in-memory snapshots.
function load(): StoreData {
  try {
    const raw = readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as StoreData;
    return {
      slots: parsed.slots?.length ? parsed.slots : defaultData().slots,
      reservations: (parsed.reservations ?? []).map((r) => ({
        ...r,
        source: r.source ?? "web",
        lang: r.lang ?? "es",
        cancellationReason: r.cancellationReason ?? null,
        updatedAt: r.updatedAt ?? r.createdAt,
        confirmedAt: r.confirmedAt ?? null,
        cancelledAt: r.cancelledAt ?? null,
      })),
    };
  } catch {
    return defaultData();
  }
}

function persist(data: StoreData) {
  try {
    mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    if (!persistenceWarned) {
      persistenceWarned = true;
      console.warn(
        "Local reservation store: couldn't persist to disk, continuing " +
          "in-memory for this instance only.",
        err,
      );
    }
  }
}

// Per date+time async lock so two near-simultaneous requests for the last
// open spot in a slot can't both read the same "booked" count and both
// succeed — mirrors what pg_advisory_xact_lock does for the real DB.
const slotLocks = new Map<string, Promise<unknown>>();

async function withSlotLock<T>(
  key: string,
  fn: () => T | Promise<T>,
): Promise<T> {
  const prior = slotLocks.get(key) ?? Promise.resolve();
  let release: () => void;
  const next = new Promise<void>((resolve) => (release = resolve));
  slotLocks.set(
    key,
    prior.then(() => next),
  );
  await prior;
  try {
    return await fn();
  } finally {
    release!();
    if (slotLocks.get(key) === next) slotLocks.delete(key);
  }
}

function confirmedBookedCount(
  data: StoreData,
  date: string,
  time: string,
): number {
  return data.reservations
    .filter(
      (r) =>
        r.reservationDate === date &&
        r.reservationTime === time &&
        r.status === "confirmed",
    )
    .reduce((sum, r) => sum + r.partySize, 0);
}

function toSummary(r: LocalReservation): ReservationSummary {
  return {
    id: r.id,
    code: r.confirmationCode,
    name: r.name,
    email: r.email,
    phone: r.phone,
    partySize: r.partySize,
    date: r.reservationDate,
    time: r.reservationTime,
    occasion: r.occasion,
    notes: r.notes,
    status: r.status,
    depositRequired: r.depositRequired,
    depositAmount: r.depositAmount,
    depositReference: r.depositReference,
    depositVerified: r.depositVerified,
    source: r.source,
    lang: r.lang,
  };
}

export async function getLocalAvailability(
  date: string,
): Promise<{ time: string; capacity: number; booked: number }[]> {
  const data = load();
  return data.slots
    .slice()
    .sort((a, b) => a.slotTime.localeCompare(b.slotTime))
    .map((slot) => ({
      time: slot.slotTime,
      capacity: slot.capacity,
      booked: confirmedBookedCount(data, date, slot.slotTime),
    }));
}

export async function bookLocalReservation(input: {
  name: string;
  email: string | null;
  phone: string | null;
  partySize: number;
  date: string;
  time: string;
  occasion: string | null;
  notes: string | null;
  depositRequired: number;
  depositAmount: number;
  depositReference: string | null;
  source: ReservationSource;
  lang: ReservationLang;
}): Promise<BookResult> {
  if (!input.partySize || input.partySize < 1) {
    return {
      id: null,
      code: null,
      status: "invalid_party_size",
      remaining: null,
      depositRequired: null,
    };
  }

  if (input.depositAmount < input.depositRequired) {
    return {
      id: null,
      code: null,
      status: "deposit_too_low",
      remaining: null,
      depositRequired: input.depositRequired,
    };
  }

  return withSlotLock(`${input.date}|${input.time}`, () => {
    const data = load();
    const slot = data.slots.find((s) => s.slotTime === input.time);
    if (!slot) {
      return {
        id: null,
        code: null,
        status: "unknown_slot",
        remaining: null,
        depositRequired: null,
      };
    }

    const booked = confirmedBookedCount(data, input.date, input.time);

    if (booked + input.partySize > slot.capacity) {
      return {
        id: null,
        code: null,
        status: "full",
        remaining: Math.max(slot.capacity - booked, 0),
        depositRequired: input.depositRequired,
      };
    }

    // Not held/counted until staff verifies the deposit — see the
    // module-level comment for why.
    const now = new Date().toISOString();
    const reservation: LocalReservation = {
      id: randomUUID(),
      confirmationCode: generateConfirmationCode(data),
      name: input.name,
      email: input.email,
      phone: input.phone,
      partySize: input.partySize,
      reservationDate: input.date,
      reservationTime: input.time,
      occasion: input.occasion,
      notes: input.notes,
      status: "pending_deposit",
      depositRequired: input.depositRequired,
      depositAmount: input.depositAmount,
      depositReference: input.depositReference,
      depositVerified: false,
      source: input.source,
      lang: input.lang,
      cancellationReason: null,
      createdAt: now,
      updatedAt: now,
      confirmedAt: null,
      cancelledAt: null,
    };
    data.reservations.push(reservation);
    persist(data);

    return {
      id: reservation.id,
      code: reservation.confirmationCode,
      status: "pending_deposit",
      remaining: Math.max(slot.capacity - booked, 0),
      depositRequired: input.depositRequired,
    };
  });
}

export async function getLocalReservationByCode(
  code: string,
): Promise<ReservationSummary | null> {
  const data = load();
  const normalized = code.trim().toUpperCase();
  const r = data.reservations.find(
    (res) => res.confirmationCode.toUpperCase() === normalized,
  );
  return r ? toSummary(r) : null;
}

export async function cancelLocalReservation(
  code: string,
): Promise<CancelResult> {
  const normalized = code.trim().toUpperCase();
  return withSlotLock(`cancel|${normalized}`, () => {
    const data = load();
    const r = data.reservations.find(
      (res) => res.confirmationCode.toUpperCase() === normalized,
    );
    if (!r) return { status: "not_found" };
    if (r.status === "cancelled") {
      return {
        status: "already_cancelled",
        name: r.name,
        email: r.email,
        date: r.reservationDate,
        time: r.reservationTime,
        partySize: r.partySize,
      };
    }
    // Pending-deposit reservations never held capacity, so cancelling
    // one is always allowed regardless of the 2h cutoff — there's
    // nothing to "free up".
    if (
      r.status === "confirmed" &&
      isPastCancellationCutoff(r.reservationDate, r.reservationTime)
    ) {
      return {
        status: "too_late",
        name: r.name,
        email: r.email,
        date: r.reservationDate,
        time: r.reservationTime,
        partySize: r.partySize,
      };
    }

    const now = new Date().toISOString();
    r.status = "cancelled";
    r.cancellationReason = "customer";
    r.cancelledAt = now;
    r.updatedAt = now;
    persist(data);
    return {
      status: "cancelled",
      name: r.name,
      email: r.email,
      date: r.reservationDate,
      time: r.reservationTime,
      partySize: r.partySize,
    };
  });
}

// --- Staff deposit review (/admin panel) ---

export async function getLocalPendingDeposits(): Promise<ReservationSummary[]> {
  const data = load();
  return data.reservations
    .filter((r) => r.status === "pending_deposit")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(toSummary);
}

// Approves a pending deposit, promoting the reservation to "confirmed".
// Capacity is re-checked HERE (not at request time) since a pending
// reservation never held its slot — someone else may have booked it in
// the meantime. If it no longer fits, the reservation is left pending so
// staff can decide (contact the customer, offer another time, etc.)
// rather than silently cancelling it.
export async function approveLocalDeposit(
  code: string,
): Promise<ApproveDepositResult> {
  const normalized = code.trim().toUpperCase();
  return withSlotLock(`approve|${normalized}`, () => {
    const data = load();
    const r = data.reservations.find(
      (res) => res.confirmationCode.toUpperCase() === normalized,
    );
    if (!r) return { status: "not_found" };
    if (r.status !== "pending_deposit") return { status: "not_pending" };

    const slot = data.slots.find((s) => s.slotTime === r.reservationTime);
    const capacity = slot?.capacity ?? 0;
    const booked = confirmedBookedCount(
      data,
      r.reservationDate,
      r.reservationTime,
    );

    if (booked + r.partySize > capacity) {
      return { status: "full", reservation: toSummary(r) };
    }

    const now = new Date().toISOString();
    r.status = "confirmed";
    r.depositVerified = true;
    r.confirmedAt = now;
    r.updatedAt = now;
    persist(data);
    return { status: "confirmed", reservation: toSummary(r) };
  });
}

export async function rejectLocalDeposit(
  code: string,
): Promise<RejectDepositResult> {
  const normalized = code.trim().toUpperCase();
  return withSlotLock(`reject|${normalized}`, () => {
    const data = load();
    const r = data.reservations.find(
      (res) => res.confirmationCode.toUpperCase() === normalized,
    );
    if (!r) return { status: "not_found" };
    if (r.status !== "pending_deposit") return { status: "not_pending" };

    const now = new Date().toISOString();
    r.status = "cancelled";
    r.cancellationReason = "deposit_rejected";
    r.cancelledAt = now;
    r.updatedAt = now;
    persist(data);
    return { status: "rejected", reservation: toSummary(r) };
  });
}

// Test-only: kept as a no-op for compatibility with existing test files —
// there's no in-memory cache to reset anymore since load() always reads
// the file fresh. Deleting the file between tests (which the tests
// already do) is what actually resets state now.
export function __resetLocalStoreForTests() {}
