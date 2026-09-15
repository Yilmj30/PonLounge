import { afterEach, describe, expect, it } from "vitest";
import { rmSync } from "node:fs";
import path from "node:path";
import {
  saveDepositReceipt,
  getDepositReceipt,
  hasDepositReceipt,
  isValidDepositReference,
} from "./depositReceipts";

const RECEIPTS_DIR = path.join(process.cwd(), ".data", "receipts");

afterEach(() => {
  rmSync(RECEIPTS_DIR, { recursive: true, force: true });
});

describe("isValidDepositReference", () => {
  it("accepts the DEP-XXXXXX shape", () => {
    expect(isValidDepositReference("DEP-A3F9K2")).toBe(true);
  });

  it("rejects a reservation code (PON- prefix) and malformed values", () => {
    expect(isValidDepositReference("PON-A3F9K2")).toBe(false);
    expect(isValidDepositReference("DEP-12345")).toBe(false); // 5 chars
    expect(isValidDepositReference("DEP-A3F9K2X")).toBe(false); // 7 chars
    expect(isValidDepositReference("../../etc/passwd")).toBe(false);
  });
});

describe("saveDepositReceipt / getDepositReceipt", () => {
  it("round-trips a saved receipt", async () => {
    await saveDepositReceipt("DEP-A3F9K2", "image/png", "ZmFrZS1pbWFnZS1kYXRh");
    const found = await getDepositReceipt("DEP-A3F9K2");
    expect(found).toEqual({
      mimeType: "image/png",
      base64Data: "ZmFrZS1pbWFnZS1kYXRh",
    });
  });

  it("returns null for a reference that was never saved", async () => {
    expect(await getDepositReceipt("DEP-ZZZZZZ")).toBeNull();
  });

  it("returns null (rather than throwing) for an invalid reference format", async () => {
    expect(await getDepositReceipt("not-a-valid-ref")).toBeNull();
  });

  it("overwrites a previous receipt for the same reference", async () => {
    await saveDepositReceipt("DEP-A3F9K2", "image/png", "first");
    await saveDepositReceipt("DEP-A3F9K2", "image/jpeg", "second");
    expect(await getDepositReceipt("DEP-A3F9K2")).toEqual({
      mimeType: "image/jpeg",
      base64Data: "second",
    });
  });
});

describe("hasDepositReceipt", () => {
  it("reflects whether a receipt exists for a reference", async () => {
    expect(await hasDepositReceipt("DEP-A3F9K2")).toBe(false);
    await saveDepositReceipt("DEP-A3F9K2", "image/png", "data");
    expect(await hasDepositReceipt("DEP-A3F9K2")).toBe(true);
  });

  it("returns false for an invalid reference format without throwing", async () => {
    expect(await hasDepositReceipt("../../etc/passwd")).toBe(false);
  });
});
