import { NextRequest, NextResponse } from "next/server";
import { approveDeposit } from "@/db/reservationsStore";
import { sendDepositApprovedEmail } from "@/lib/email";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const normalizedCode = decodeURIComponent(code).trim().toUpperCase();

  let result;
  try {
    result = await approveDeposit(normalizedCode);
  } catch (err) {
    console.error("POST /api/admin/deposits/[code]/approve failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  if (result.status === "confirmed" && result.reservation?.email) {
    try {
      await sendDepositApprovedEmail({
        to: result.reservation.email,
        code: result.reservation.code,
        name: result.reservation.name,
        partySize: result.reservation.partySize,
        date: result.reservation.date,
        time: result.reservation.time,
        lang: result.reservation.lang,
      });
    } catch (err) {
      console.error("Failed to send deposit-approved email:", err);
    }
  }

  return NextResponse.json(result);
}
