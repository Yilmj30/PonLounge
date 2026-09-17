import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { getSpots, setSpotBlocked } from "./spotsStore";
import {
  bookLocalReservation,
  approveLocalDeposit,
  getLocalAvailability,
} from "./localStore";
import { TOTAL_SPOTS, TABLE_COUNT, BAR_SEAT_COUNT } from "@/lib/spots";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "pon-spots-"));
  process.env.PON_LOCAL_DATA_DIR = dir;
});

afterEach(() => {
  delete process.env.PON_LOCAL_DATA_DIR;
  rmSync(dir, { recursive: true, force: true });
});

function reservation(overrides: Record<string, unknown> = {}) {
  return {
    name: "Ana Torres",
    email: null,
    phone: null,
    partySize: 4,
    date: "2099-01-01",
    time: "16:00",
    occasion: null,
    notes: null,
    depositRequired: 120000,
    depositAmount: 120000,
    depositReference: null,
    source: "web" as const,
    lang: "es" as const,
    ...overrides,
  };
}

describe("spotsStore", () => {
  it("starts with 6 tables and 4 bar stools, all free", async () => {
    const spots = await getSpots();
    expect(spots).toHaveLength(TOTAL_SPOTS);
    expect(spots.filter((s) => s.kind === "mesa")).toHaveLength(TABLE_COUNT);
    expect(spots.filter((s) => s.kind === "barra")).toHaveLength(
      BAR_SEAT_COUNT,
    );
    expect(spots.every((s) => !s.blocked)).toBe(true);
  });

  it("blocks and unblocks a spot, keeping the reason only while blocked", async () => {
    const blocked = await setSpotBlocked("mesa-3", true, "ocupada sin reserva");
    expect(blocked).toMatchObject({
      status: "ok",
      spot: {
        id: "mesa-3",
        blocked: true,
        blockedReason: "ocupada sin reserva",
      },
    });
    expect((await getSpots()).find((s) => s.id === "mesa-3")?.blocked).toBe(
      true,
    );

    const freed = await setSpotBlocked("mesa-3", false, null);
    expect(freed).toMatchObject({
      status: "ok",
      spot: { blocked: false, blockedReason: null },
    });
  });

  it("returns not_found for a spot that doesn't exist", async () => {
    expect(await setSpotBlocked("mesa-99", true, null)).toEqual({
      status: "not_found",
    });
  });
});

describe("blocked spots and availability", () => {
  it("removes blocked spots from what the website can book", async () => {
    await setSpotBlocked("mesa-1", true, null);
    await setSpotBlocked("barra-2", true, null);

    const slots = await getLocalAvailability("2099-01-01");
    expect(slots.every((s) => s.capacity === TOTAL_SPOTS - 2)).toBe(true);
  });

  it("refuses a booking when every spot is blocked", async () => {
    for (const spot of await getSpots()) {
      await setSpotBlocked(spot.id, true, "cerrado por evento privado");
    }

    const result = await bookLocalReservation(reservation());
    expect(result.status).toBe("full");
    expect(result.remaining).toBe(0);
  });

  it("counts blocked spots and confirmed reservations together", async () => {
    // Block everything but two spots, then confirm one reservation.
    const spots = await getSpots();
    for (const spot of spots.slice(0, TOTAL_SPOTS - 2)) {
      await setSpotBlocked(spot.id, true, null);
    }
    const booked = await bookLocalReservation(reservation());
    await approveLocalDeposit(booked.code!);

    const slots = await getLocalAvailability("2099-01-01");
    expect(slots[0]).toMatchObject({ capacity: 2, booked: 1 });

    // One spot left: this booking fits, the next one doesn't.
    const second = await bookLocalReservation(reservation());
    expect(second.status).toBe("pending_deposit");
    await approveLocalDeposit(second.code!);

    const third = await bookLocalReservation(reservation());
    expect(third.status).toBe("full");
  });

  it("frees the spot again once staff unblocks it", async () => {
    for (const spot of await getSpots()) {
      await setSpotBlocked(spot.id, true, null);
    }
    expect((await bookLocalReservation(reservation())).status).toBe("full");

    await setSpotBlocked("mesa-1", false, null);
    expect((await bookLocalReservation(reservation())).status).toBe(
      "pending_deposit",
    );
  });

  it("blocks an approval when staff blocked the tables while it was pending", async () => {
    const booked = await bookLocalReservation(reservation());
    expect(booked.status).toBe("pending_deposit");

    for (const spot of await getSpots()) {
      await setSpotBlocked(spot.id, true, null);
    }

    const result = await approveLocalDeposit(booked.code!);
    expect(result.status).toBe("full");
    expect(result.reservation?.status).toBe("pending_deposit");
  });
});
