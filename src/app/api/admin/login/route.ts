import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, roleForPassword } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const password = (body as { password?: string })?.password;
  const role = typeof password === "string" ? roleForPassword(password) : null;
  if (!role) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const res = NextResponse.json({ status: "ok", role });
  // The cookie holds the password itself — see adminAuth.ts.
  res.cookies.set(ADMIN_SESSION_COOKIE, password as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h
  });
  return res;
}
