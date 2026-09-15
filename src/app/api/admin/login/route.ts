import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PASSWORD } from "@/lib/config";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const password = (body as { password?: string })?.password;
  if (typeof password !== "string" || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const res = NextResponse.json({ status: "ok" });
  res.cookies.set(ADMIN_SESSION_COOKIE, ADMIN_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h
  });
  return res;
}
