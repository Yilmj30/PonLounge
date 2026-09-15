import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/db/reservationsStore";

export const dynamic = "force-dynamic";

const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !dateRe.test(date)) {
    return NextResponse.json(
      { error: "Missing or invalid ?date=YYYY-MM-DD" },
      { status: 400 },
    );
  }

  try {
    const slots = await getAvailability(date);
    return NextResponse.json({ date, slots });
  } catch (err) {
    console.error("GET /api/availability failed:", err);
    return NextResponse.json(
      { error: "availability_unavailable" },
      { status: 503 },
    );
  }
}
