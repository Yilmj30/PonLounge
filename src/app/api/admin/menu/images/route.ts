import { NextRequest, NextResponse } from "next/server";
import { saveMenuImage } from "@/db/menuStore";
import { menuImageUploadSchema } from "@/lib/menuValidation";
import { parseJsonBody, requireAdmin, serverError } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

// Uploads a photo and returns its URL; the editor then saves that URL on
// the item. Nothing public changes until the item itself is saved.
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody(req, menuImageUploadSchema);
  if ("error" in body) return body.error;

  try {
    const url = await saveMenuImage(body.data.mimeType, body.data.base64Data);
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    return serverError("POST /api/admin/menu/images", err);
  }
}
