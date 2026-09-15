import { NextRequest } from "next/server";
import { createMenuCategory } from "@/db/menuStore";
import { menuCategorySchema } from "@/lib/menuValidation";
import {
  parseJsonBody,
  requireAdmin,
  revalidateMenuPages,
  serverError,
  storeResultResponse,
} from "@/lib/adminApi";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody(req, menuCategorySchema);
  if ("error" in body) return body.error;

  try {
    const result = await createMenuCategory(body.data);
    if (result.status === "ok") revalidateMenuPages();
    return storeResultResponse(result);
  } catch (err) {
    return serverError("POST /api/admin/menu/categories", err);
  }
}
