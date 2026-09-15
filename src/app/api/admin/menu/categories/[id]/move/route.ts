import { NextRequest } from "next/server";
import { moveMenuCategory } from "@/db/menuStore";
import { moveSchema } from "@/lib/menuValidation";
import {
  parseJsonBody,
  requireAdmin,
  revalidateMenuPages,
  serverError,
  storeResultResponse,
} from "@/lib/adminApi";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody(req, moveSchema);
  if ("error" in body) return body.error;

  const { id } = await params;
  try {
    const result = await moveMenuCategory(
      decodeURIComponent(id),
      body.data.direction,
    );
    if (result.status === "ok") revalidateMenuPages();
    return storeResultResponse(result);
  } catch (err) {
    return serverError("POST /api/admin/menu/categories/[id]/move", err);
  }
}
