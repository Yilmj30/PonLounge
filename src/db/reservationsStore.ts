// Single entry point the API routes use for availability + booking +
// deposit review.
//
// Picks a backend automatically: real Postgres (Neon) when DATABASE_URL /
// POSTGRES_URL is set, otherwise the local JSON-file-simulated database in
// localStore.ts. This means automatic booking works out of the box before
// Postgres is provisioned — flip it to the real thing later just by
// setting the env var, no code change needed.

import { eq, and, sql as sqlOp } from "drizzle-orm";
import { getDb, getSql, hasRemoteDatabase } from "@/db/client";
import { slotCapacity, reservations } from "@/db/schema";
import { isPastCancellationCutoff } from "@/lib/reservation";
import {
  getLocalAvailability,
  bookLocalReservation,
  getLocalReservationByCode,
  cancelLocalReservation,
  getLocalPendingDeposits,
  approveLocalDeposit,
  rejectLocalDeposit,
  type BookResult,
  type ReservationSummary,
  type CancelResult,
  type ApproveDepositResult,
  type RejectDepositResult,
  type ReservationSource,
  type ReservationLang,
} from "@/db/localStore";

export type AvailabilitySlot = {
  time: string;
  capacity: number;
  booked: number;
};
export type {
  BookResult,
  ReservationSummary,
  CancelResult,
  ApproveDepositResult,
  RejectDepositResult,
  ReservationSource,
  ReservationLang,
};

function rowToSummary(r: typeof reservations.$inferSelect): ReservationSummary {
  return {
    id: r.id,
    code: r.confirmationCode,
    name: r.name,
    email: r.email,
    phone: r.phone,
    partySize: r.partySize,
    date: r.reservationDate,
    time: r.reservationTime.slice(0, 5),
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

export async function getAvailability(
  date: string,
): Promise<AvailabilitySlot[]> {
  if (!hasRemoteDatabase()) {
    return getLocalAvailability(date);
  }

  const db = getDb();

  const slots = await db
    .select()
    .from(slotCapacity)
    .orderBy(slotCapacity.slotTime);

  const booked = await db
    .select({
      time: reservations.reservationTime,
      total: sqlOp<number>`coalesce(sum(${reservations.partySize}), 0)`,
    })
    .from(reservations)
    .where(
      and(
        eq(reservations.reservationDate, date),
        eq(reservations.status, "confirmed"),
      ),
    )
    .groupBy(reservations.reservationTime);

  const bookedByTime = new Map(booked.map((b) => [b.time, Number(b.total)]));

  return slots.map((slot) => ({
    time: slot.slotTime.slice(0, 5),
    capacity: slot.capacity,
    booked: bookedByTime.get(slot.slotTime) ?? 0,
  }));
}

export async function bookReservation(input: {
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
  if (!hasRemoteDatabase()) {
    return bookLocalReservation(input);
  }

  const sql = getSql();
  const rows = (await sql`
    select * from book_reservation(
      ${input.name}, ${input.email}, ${input.phone}, ${input.partySize},
      ${input.date}, ${input.time}, ${input.occasion}, ${input.notes},
      ${input.depositRequired}, ${input.depositAmount}, ${input.depositReference},
      ${input.source}::reservation_source, ${input.lang}::reservation_lang
    )
  `) as (Omit<BookResult, "depositRequired"> & {
    deposit_required: number | null;
  })[];

  const row = rows[0];
  return (
    (row && {
      id: row.id,
      code: row.code,
      status: row.status,
      remaining: row.remaining,
      depositRequired: row.deposit_required,
    }) ?? {
      id: null,
      code: null,
      status: "unknown_slot" as const,
      remaining: null,
      depositRequired: null,
    }
  );
}

export async function getReservationByCode(
  code: string,
): Promise<ReservationSummary | null> {
  if (!hasRemoteDatabase()) {
    return getLocalReservationByCode(code);
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(reservations)
    .where(eq(reservations.confirmationCode, code.trim().toUpperCase()))
    .limit(1);
  const r = rows[0];
  return r ? rowToSummary(r) : null;
}

export async function cancelReservation(code: string): Promise<CancelResult> {
  if (!hasRemoteDatabase()) {
    return cancelLocalReservation(code);
  }

  const normalizedCode = code.trim().toUpperCase();
  const db = getDb();
  const rows = await db
    .select()
    .from(reservations)
    .where(eq(reservations.confirmationCode, normalizedCode))
    .limit(1);
  const existing = rows[0];
  if (!existing) return { status: "not_found" };

  const date = existing.reservationDate;
  const time = existing.reservationTime.slice(0, 5);
  const name = existing.name;
  const email = existing.email;
  const partySize = existing.partySize;

  if (existing.status === "cancelled") {
    return { status: "already_cancelled", name, email, date, time, partySize };
  }
  if (existing.status === "confirmed" && isPastCancellationCutoff(date, time)) {
    return { status: "too_late", name, email, date, time, partySize };
  }

  const updated = await db
    .update(reservations)
    .set({
      status: "cancelled",
      cancellationReason: "customer",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(reservations.confirmationCode, normalizedCode),
        eq(reservations.status, existing.status),
      ),
    )
    .returning({ id: reservations.id });

  if (updated.length === 0) {
    return { status: "already_cancelled", name, email, date, time, partySize };
  }

  return { status: "cancelled", name, email, date, time, partySize };
}

// --- Staff deposit review (/admin panel) ---

export async function getPendingDeposits(): Promise<ReservationSummary[]> {
  if (!hasRemoteDatabase()) {
    return getLocalPendingDeposits();
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(reservations)
    .where(eq(reservations.status, "pending_deposit"))
    .orderBy(reservations.createdAt);

  return rows.map(rowToSummary);
}

export async function approveDeposit(
  code: string,
): Promise<ApproveDepositResult> {
  if (!hasRemoteDatabase()) {
    return approveLocalDeposit(code);
  }

  const normalizedCode = code.trim().toUpperCase();
  const sql = getSql();
  const rows =
    (await sql`select * from approve_deposit(${normalizedCode})`) as {
      status: ApproveDepositResult["status"];
    }[];
  const status = rows[0]?.status ?? "not_found";

  if (status !== "confirmed") {
    const rows2 = await getDb()
      .select()
      .from(reservations)
      .where(eq(reservations.confirmationCode, normalizedCode))
      .limit(1);
    const r = rows2[0];
    return { status, reservation: r ? rowToSummary(r) : undefined };
  }

  const rows2 = await getDb()
    .select()
    .from(reservations)
    .where(eq(reservations.confirmationCode, normalizedCode))
    .limit(1);
  const r = rows2[0];
  return { status: "confirmed", reservation: r ? rowToSummary(r) : undefined };
}

export async function rejectDeposit(
  code: string,
): Promise<RejectDepositResult> {
  if (!hasRemoteDatabase()) {
    return rejectLocalDeposit(code);
  }

  const normalizedCode = code.trim().toUpperCase();
  const sql = getSql();
  const rows = (await sql`select * from reject_deposit(${normalizedCode})`) as {
    status: RejectDepositResult["status"];
  }[];
  const status = rows[0]?.status ?? "not_found";

  const rows2 = await getDb()
    .select()
    .from(reservations)
    .where(eq(reservations.confirmationCode, normalizedCode))
    .limit(1);
  const r = rows2[0];
  return { status, reservation: r ? rowToSummary(r) : undefined };
}
