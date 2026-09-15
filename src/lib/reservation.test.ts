import { describe, expect, it } from "vitest";
import { isPastCancellationCutoff } from "./reservation";

describe("isPastCancellationCutoff", () => {
  it("is false well before the reservation", () => {
    const now = new Date(2099, 0, 1, 10, 0);
    expect(isPastCancellationCutoff("2099-01-01", "16:00", now)).toBe(false);
  });

  it("is false just outside the 2h cutoff", () => {
    const now = new Date(2099, 0, 1, 13, 59);
    expect(isPastCancellationCutoff("2099-01-01", "16:00", now)).toBe(false);
  });

  it("is true exactly at the 2h cutoff", () => {
    const now = new Date(2099, 0, 1, 14, 0);
    expect(isPastCancellationCutoff("2099-01-01", "16:00", now)).toBe(true);
  });

  it("is true inside the cutoff window", () => {
    const now = new Date(2099, 0, 1, 15, 0);
    expect(isPastCancellationCutoff("2099-01-01", "16:00", now)).toBe(true);
  });

  it("is true after the reservation time has already passed", () => {
    const now = new Date(2099, 0, 1, 20, 0);
    expect(isPastCancellationCutoff("2099-01-01", "16:00", now)).toBe(true);
  });
});
