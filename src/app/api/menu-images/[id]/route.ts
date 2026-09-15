import { NextRequest, NextResponse } from "next/server";
import { getMenuImage } from "@/db/menuStore";

export const dynamic = "force-dynamic";

// Public: serves menu photos uploaded from /admin/carta. Each upload gets a
// new id (replacing a photo never reuses one), so responses can be cached
// forever.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let image;
  try {
    image = await getMenuImage(id);
  } catch (err) {
    console.error("GET /api/menu-images/[id] failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  if (!image) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(image.base64Data, "base64"), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
