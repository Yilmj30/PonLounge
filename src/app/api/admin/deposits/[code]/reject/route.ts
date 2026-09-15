import { NextRequest, NextResponse } from "next/server";
import { rejectDeposit } from "@/db/reservationsStore";
import { sendDepositRejectedEmail } from "@/lib/email";
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
    result = await rejectDeposit(normalizedCode);
  } catch (err) {
    console.error("POST /api/admin/deposits/[code]/reject failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  if (result.status === "rejected" && result.reservation?.email) {
    try {
      await sendDepositRejectedEmail({
        to: result.reservation.email,
        name: result.reservation.name,
        date: result.reservation.date,
        time: result.reservation.time,
        lang: result.reservation.lang,
      });
    } catch (err) {
      console.error("Failed to send deposit-rejected email:", err);
    }
  }

  return NextResponse.json(result);
}
