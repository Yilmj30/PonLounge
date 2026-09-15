import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ status: "ok" });
  res.cookies.delete(ADMIN_SESSION_COOKIE);
  return res;
}
