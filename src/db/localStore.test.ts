import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rmSync } from "node:fs";
import path from "node:path";
import {
  getLocalAvailability,
  bookLocalReservation,
  cancelLocalReservation,
  getLocalReservationByCode,
  getLocalPendingDeposits,
  approveLocalDeposit,
  rejectLocalDeposit,
  __resetLocalStoreForTests,
} from "./localStore";

const DATA_FILE = path.join(process.cwd(), ".data", "local-reservations.json");

const DEPOSIT_PER_PERSON = 30000;

function baseInput(
  overrides: Partial<Parameters<typeof bookLocalReservation>[0]> = {},
) {
  const partySize = overrides.partySize ?? 4;
  return {
    name: "Ana Torres",
    email: null,
    phone: null,
    partySize,
    date: "2099-01-01",
    time: "16:00",
    occasion: null,
    notes: null,
    depositRequired: partySize * DEPOSIT_PER_PERSON,
    depositAmount: partySize * DEPOSIT_PER_PERSON,
    depositReference: null,
    source: "web" as const,
    lang: "es" as const,
    ...overrides,
  };
}

beforeEach(() => {
  rmSync(DATA_FILE, { force: true });
  __resetLocalStoreForTests();
});

afterEach(() => {
  rmSync(DATA_FILE, { force: true });
  __resetLocalStoreForTests();
  vi.useRealTimers();
});

describe("localStore", () => {
  it("seeds default slots (16:00–21:00 every 30 min, capacity 30) with zero booked", async () => {
    const slots = await getLocalAvailability("2099-01-01");
    expect(slots).toHaveLength(11);
    expect(slots[0]).toEqual({ time: "16:00", capacity: 30, booked: 0 });
    expect(slots.at(-1)).toEqual({ time: "21:00", capacity: 30, booked: 0 });
    expect(slots.every((s) => s.capacity === 30)).toBe(true);
  });

  it("books a reservation as pending_deposit, returns a code, and does NOT count it in availability yet", async () => {
    const result = await bookLocalReservation(baseInput());
    expect(result.status).toBe("pending_deposit");
    expect(result.id).toBeTruthy();
    expect(result.code).toMatch(/^PON-[A-Z0-9]{6}$/);

    const slots = await getLocalAvailability("2099-01-01");
    const slot = slots.find((s) => s.time === "16:00");
    // Pending reservations don't hold capacity — only approved
    // (confirmed) ones do.
    expect(slot?.booked).toBe(0);
  });

  it("rejects a booking that would exceed slot capacity against already-confirmed reservations", async () => {
    const first = await bookLocalReservation(baseInput({ partySize: 30 }));
    await approveLocalDeposit(first.code!);

    const second = await bookLocalReservation(baseInput({ partySize: 1 }));
    expect(second.status).toBe("full");
    expect(second.remaining).toBe(0);
  });

  it("rejects a time that isn't a configured slot", async () => {
    const result = await bookLocalReservation(baseInput({ time: "15:00" }));
    expect(result.status).toBe("unknown_slot");
  });

  it("rejects an invalid party size", async () => {
    const result = await bookLocalReservation(baseInput({ partySize: 0 }));
    expect(result.status).toBe("invalid_party_size");
  });

  it("never generates a duplicate confirmation code across many bookings", async () => {
    const times = [
      "16:00",
      "16:30",
      "17:00",
      "17:30",
      "18:00",
      "18:30",
      "19:00",
      "19:30",
      "20:00",
      "20:30",
      "21:00",
    ];
    const codes = new Set<string>();
    for (const time of times) {
      const result = await bookLocalReservation(
        baseInput({ time, partySize: 1 }),
      );
      expect(result.status).toBe("pending_deposit");
      expect(codes.has(result.code!)).toBe(false);
      codes.add(result.code!);
    }
    expect(codes.size).toBe(times.length);
  });
});

describe("deposit amount validation", () => {
  it("rejects a booking whose declared deposit is below what's required", async () => {
    const result = await bookLocalReservation(
      baseInput({ partySize: 2, depositAmount: 59_999 }),
    );
    expect(result.status).toBe("deposit_too_low");
    expect(result.depositRequired).toBe(60_000);
    expect(result.id).toBeNull();
  });

  it("accepts a booking whose deposit exactly matches what's required", async () => {
    const result = await bookLocalReservation(
      baseInput({ partySize: 2, depositAmount: 60_000 }),
    );
    expect(result.status).toBe("pending_deposit");
  });

  it("stores the reported deposit amount and reference", async () => {
    const booked = await bookLocalReservation(
      baseInput({
        partySize: 3,
        depositAmount: 90_000,
        depositReference: "DEP-A3F9K2",
      }),
    );
    const found = await getLocalReservationByCode(booked.code!);
    expect(found?.depositRequired).toBe(90_000);
    expect(found?.depositAmount).toBe(90_000);
    expect(found?.depositReference).toBe("DEP-A3F9K2");
    expect(found?.depositVerified).toBe(false);
    expect(found?.status).toBe("pending_deposit");
  });
});

describe("approveLocalDeposit / rejectLocalDeposit", () => {
  it("approves a pending deposit, promoting it to confirmed and counting it in availability", async () => {
    const booked = await bookLocalReservation(baseInput());
    const result = await approveLocalDeposit(booked.code!);
    expect(result.status).toBe("confirmed");
    expect(result.reservation?.status).toBe("confirmed");
    expect(result.reservation?.depositVerified).toBe(true);

    const slots = await getLocalAvailability("2099-01-01");
    expect(slots.find((s) => s.time === "16:00")?.booked).toBe(4);
  });

  it("lists pending deposits and no longer lists one once approved", async () => {
    const booked = await bookLocalReservation(baseInput());
    let pending = await getLocalPendingDeposits();
    expect(pending.map((p) => p.code)).toContain(booked.code);

    await approveLocalDeposit(booked.code!);
    pending = await getLocalPendingDeposits();
    expect(pending.map((p) => p.code)).not.toContain(booked.code);
  });

  it("refuses to approve if the slot filled up in the meantime, leaving it pending", async () => {
    // Both fit when booked, since neither is confirmed (and thus counted)
    // yet — pending reservations don't hold capacity.
    const first = await bookLocalReservation(baseInput({ partySize: 20 }));
    const second = await bookLocalReservation(baseInput({ partySize: 20 }));
    expect(first.status).toBe("pending_deposit");
    expect(second.status).toBe("pending_deposit");

    // Approving the first fills the slot (20/30).
    await approveLocalDeposit(first.code!);

    // Now approving the second would push it to 40/30 — no longer fits.
    const result = await approveLocalDeposit(second.code!);
    expect(result.status).toBe("full");

    const stillPending = await getLocalReservationByCode(second.code!);
    expect(stillPending?.status).toBe("pending_deposit");
  });

  it("returns not_found when approving an unknown code", async () => {
    const result = await approveLocalDeposit("PON-ZZZZZZ");
    expect(result.status).toBe("not_found");
  });

  it("returns not_pending when approving an already-confirmed reservation", async () => {
    const booked = await bookLocalReservation(baseInput());
    await approveLocalDeposit(booked.code!);
    const second = await approveLocalDeposit(booked.code!);
    expect(second.status).toBe("not_pending");
  });

  it("rejects a pending deposit, cancelling it without affecting capacity", async () => {
    const booked = await bookLocalReservation(baseInput());
    const result = await rejectLocalDeposit(booked.code!);
    expect(result.status).toBe("rejected");
    expect(result.reservation?.status).toBe("cancelled");

    const stored = await getLocalReservationByCode(booked.code!);
    expect(stored?.status).toBe("cancelled");
  });

  it("returns not_found when rejecting an unknown code", async () => {
    const result = await rejectLocalDeposit("PON-ZZZZZZ");
    expect(result.status).toBe("not_found");
  });
});

describe("cancelLocalReservation", () => {
  it("cancels a pending-deposit reservation regardless of the 2h cutoff (it never held its slot)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2099, 0, 1, 15, 55)); // 5 min before 16:00
    const booked = await bookLocalReservation(
      baseInput({ email: "ana@example.com" }),
    );
    const result = await cancelLocalReservation(booked.code!);
    expect(result.status).toBe("cancelled");
  });

  it("cancels a confirmed reservation (by code) and frees its capacity", async () => {
    const booked = await bookLocalReservation(
      baseInput({ email: "ana@example.com" }),
    );
    await approveLocalDeposit(booked.code!);

    const result = await cancelLocalReservation(booked.code!);
    expect(result).toEqual({
      status: "cancelled",
      name: "Ana Torres",
      email: "ana@example.com",
      date: "2099-01-01",
      time: "16:00",
      partySize: 4,
    });

    const slots = await getLocalAvailability("2099-01-01");
    expect(slots.find((s) => s.time === "16:00")?.booked).toBe(0);
  });

  it("accepts a code regardless of upper/lowercase", async () => {
    const booked = await bookLocalReservation(baseInput());
    const result = await cancelLocalReservation(booked.code!.toLowerCase());
    expect(result.status).toBe("cancelled");
  });

  it("returns not_found for an unknown code", async () => {
    const result = await cancelLocalReservation("PON-ZZZZZZ");
    expect(result).toEqual({ status: "not_found" });
  });

  it("returns already_cancelled on a second cancellation", async () => {
    const booked = await bookLocalReservation(baseInput());
    await cancelLocalReservation(booked.code!);
    const second = await cancelLocalReservation(booked.code!);
    expect(second.status).toBe("already_cancelled");
  });

  it("blocks cancellation of a CONFIRMED reservation inside the 2h cutoff", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2099, 0, 1, 0, 0)); // far before 16:00, booking allowed
    const booked = await bookLocalReservation(baseInput());
    await approveLocalDeposit(booked.code!);

    vi.setSystemTime(new Date(2099, 0, 1, 15, 0)); // 1h before the 16:00 slot
    const result = await cancelLocalReservation(booked.code!);
    expect(result).toEqual({
      status: "too_late",
      name: "Ana Torres",
      email: null,
      date: "2099-01-01",
      time: "16:00",
      partySize: 4,
    });

    const stored = await getLocalReservationByCode(booked.code!);
    expect(stored?.status).toBe("confirmed");

    const slots = await getLocalAvailability("2099-01-01");
    expect(slots.find((s) => s.time === "16:00")?.booked).toBe(4);
  });

  it("allows cancellation right at the 2h boundary minus a minute", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2099, 0, 1, 0, 0));
    const booked = await bookLocalReservation(baseInput());
    await approveLocalDeposit(booked.code!);

    vi.setSystemTime(new Date(2099, 0, 1, 13, 59));
    const result = await cancelLocalReservation(booked.code!);
    expect(result.status).toBe("cancelled");
  });
});

describe("getLocalReservationByCode", () => {
  it("returns null for an unknown code", async () => {
    const result = await getLocalReservationByCode("PON-ZZZZZZ");
    expect(result).toBeNull();
  });

  it("returns the reservation summary for a known code", async () => {
    const booked = await bookLocalReservation(baseInput());
    const result = await getLocalReservationByCode(booked.code!);
    expect(result).toEqual({
      id: booked.id,
      code: booked.code,
      name: "Ana Torres",
      email: null,
      phone: null,
      partySize: 4,
      date: "2099-01-01",
      time: "16:00",
      occasion: null,
      notes: null,
      status: "pending_deposit",
      depositRequired: 120000,
      depositAmount: 120000,
      depositReference: null,
      depositVerified: false,
      source: "web",
      lang: "es",
    });
  });

  it("remembers the channel and language the reservation was made in", async () => {
    const booked = await bookLocalReservation(
      baseInput({ source: "email", lang: "en" }),
    );
    const result = await getLocalReservationByCode(booked.code!);
    expect(result?.source).toBe("email");
    expect(result?.lang).toBe("en");
  });

  it("is case-insensitive", async () => {
    const booked = await bookLocalReservation(baseInput());
    const result = await getLocalReservationByCode(booked.code!.toLowerCase());
    expect(result?.code).toBe(booked.code);
  });
});
