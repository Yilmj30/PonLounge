import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  saveDepositReceipt,
  isValidDepositReference,
  MAX_RECEIPT_BYTES,
  ALLOWED_RECEIPT_MIME_TYPES,
} from "@/lib/depositReceipts";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  depositReference: z.string().trim(),
  mimeType: z.enum(ALLOWED_RECEIPT_MIME_TYPES),
  base64Data: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { depositReference, mimeType, base64Data } = parsed.data;

  if (!isValidDepositReference(depositReference)) {
    return NextResponse.json({ error: "invalid_reference" }, { status: 400 });
  }

  // Rough size check on the base64 string (actual bytes are ~0.75x this,
  // but checking pre-decode is cheap and avoids decoding an oversized
  // payload just to reject it).
  if (base64Data.length > MAX_RECEIPT_BYTES * 1.4) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  try {
    await saveDepositReceipt(depositReference, mimeType, base64Data);
  } catch (err) {
    console.error("Failed to save deposit receipt:", err);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" }, { status: 201 });
}
