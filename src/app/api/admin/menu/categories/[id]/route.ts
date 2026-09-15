import { NextRequest } from "next/server";
import { deleteMenuCategory, updateMenuCategory } from "@/db/menuStore";
import { menuCategorySchema } from "@/lib/menuValidation";
import {
  parseJsonBody,
  requireAdmin,
  revalidateMenuPages,
  serverError,
  storeResultResponse,
} from "@/lib/adminApi";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody(req, menuCategorySchema);
  if ("error" in body) return body.error;

  const { id } = await params;
  try {
    const result = await updateMenuCategory(decodeURIComponent(id), body.data);
    if (result.status === "ok") revalidateMenuPages();
    return storeResultResponse(result);
  } catch (err) {
    return serverError("PATCH /api/admin/menu/categories/[id]", err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const result = await deleteMenuCategory(decodeURIComponent(id));
    if (result.status === "ok") revalidateMenuPages();
    return storeResultResponse(result);
  } catch (err) {
    return serverError("DELETE /api/admin/menu/categories/[id]", err);
  }
}
