import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { isAdminAuthenticated } from "@/lib/adminAuth";

// Shared plumbing for the /api/admin/menu/* route handlers.

export async function requireAdmin(): Promise<NextResponse | null> {
  return (await isAdminAuthenticated())
    ? null
    : NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function parseJsonBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T,
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      error: NextResponse.json({ error: "invalid_body" }, { status: 400 }),
    };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: NextResponse.json(
        { error: "invalid_input", details: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }
  return { data: parsed.data };
}

// Store results use { status: "ok" | "<reason>" }; map them to HTTP codes.
export function storeResultResponse(result: { status: string }) {
  const httpStatus =
    result.status === "ok"
      ? 200
      : result.status === "not_found"
        ? 404
        : result.status === "category_not_empty"
          ? 409
          : 400;
  return NextResponse.json(result, { status: httpStatus });
}

export function serverError(route: string, err: unknown) {
  console.error(`${route} failed:`, err);
  return NextResponse.json({ error: "unavailable" }, { status: 503 });
}

// The public pages that render the menu are statically cached; mark them
// stale so the next visit shows the owners' change.
export function revalidateMenuPages() {
  revalidatePath("/carta");
  revalidatePath("/");
}
