import { NextRequest } from "next/server";
import { z } from "zod";
import { setSpotBlocked } from "@/db/spotsStore";
import {
  parseJsonBody,
  requireAdmin,
  revalidateMenuPages,
  serverError,
  storeResultResponse,
} from "@/lib/adminApi";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  blocked: z.boolean(),
  // Optional note shown in the panel, e.g. "mesa ocupada sin reserva".
  reason: z.string().trim().max(120).nullish(),
});

// Blocking/unblocking a table is day-to-day floor work, so employees can do
// it too — unlike the menu editor, which is owners only.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody(req, bodySchema);
  if ("error" in body) return body.error;

  const { id } = await params;
  try {
    const result = await setSpotBlocked(
      decodeURIComponent(id),
      body.data.blocked,
      body.data.reason ?? null,
    );
    // The home page prints how many spots are left, so refresh it.
    if (result.status === "ok") revalidateMenuPages();
    return storeResultResponse(result);
  } catch (err) {
    return serverError("PATCH /api/admin/spots/[id]", err);
  }
}
