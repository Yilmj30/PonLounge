// Stores the deposit receipt screenshot the customer uploads, keyed by
// the same "DEP-XXXXXX" reference code shown in the wizard and included
// in the transfer's description. This is how staff can see the actual
// screenshot on the /admin panel regardless of which channel the
// reservation came through — the web form uploads it directly, and the
// "reservar por correo" mailto flow uploads it too (mailto: links can't
// carry attachments, so this is the only way that channel's proof of
// payment ever reaches the system).
//
// Stored in the deposit_receipts Postgres table when DATABASE_URL is set.
// Otherwise falls back to a small JSON sidecar per reference (base64 +
// mime) under .data/receipts/ — same local-file-simulated pattern as the
// rest of the store. Not meant for high volume; fine for a single venue's
// traffic.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb, hasRemoteDatabase } from "@/db/client";
import { depositReceipts } from "@/db/schema";

const RECEIPTS_DIR = path.join(process.cwd(), ".data", "receipts");

// Matches the format generateDepositReference() produces.
const REFERENCE_PATTERN = /^DEP-[A-Z0-9]{6}$/;

export const MAX_RECEIPT_BYTES = 4 * 1024 * 1024; // 4MB
export const ALLOWED_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

function fileFor(reference: string): string {
  // The reference is validated against a fixed alphabet/shape before
  // this is ever called, so it's safe to use directly in a path with no
  // traversal risk — but double-check here too, defensively.
  if (!REFERENCE_PATTERN.test(reference)) {
    throw new Error(`Invalid deposit reference format: ${reference}`);
  }
  return path.join(RECEIPTS_DIR, `${reference}.json`);
}

export function isValidDepositReference(reference: string): boolean {
  return REFERENCE_PATTERN.test(reference);
}

export async function saveDepositReceipt(
  reference: string,
  mimeType: string,
  base64Data: string,
): Promise<void> {
  if (!isValidDepositReference(reference)) {
    throw new Error(`Invalid deposit reference format: ${reference}`);
  }

  if (hasRemoteDatabase()) {
    const sizeBytes = Buffer.byteLength(base64Data, "base64");
    await getDb()
      .insert(depositReceipts)
      .values({ depositReference: reference, mimeType, base64Data, sizeBytes })
      .onConflictDoUpdate({
        target: depositReceipts.depositReference,
        set: { mimeType, base64Data, sizeBytes, updatedAt: new Date() },
      });
    return;
  }

  mkdirSync(RECEIPTS_DIR, { recursive: true });
  writeFileSync(
    fileFor(reference),
    JSON.stringify({ mimeType, base64Data }),
    "utf-8",
  );
}

export async function getDepositReceipt(
  reference: string,
): Promise<{ mimeType: string; base64Data: string } | null> {
  if (!isValidDepositReference(reference)) return null;

  if (hasRemoteDatabase()) {
    const rows = await getDb()
      .select({
        mimeType: depositReceipts.mimeType,
        base64Data: depositReceipts.base64Data,
      })
      .from(depositReceipts)
      .where(eq(depositReceipts.depositReference, reference))
      .limit(1);
    return rows[0] ?? null;
  }

  const file = fileFor(reference);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}

export async function hasDepositReceipt(reference: string): Promise<boolean> {
  if (!isValidDepositReference(reference)) return false;

  if (hasRemoteDatabase()) {
    const rows = await getDb()
      .select({ ref: depositReceipts.depositReference })
      .from(depositReceipts)
      .where(eq(depositReceipts.depositReference, reference))
      .limit(1);
    return rows.length > 0;
  }

  return existsSync(fileFor(reference));
}
