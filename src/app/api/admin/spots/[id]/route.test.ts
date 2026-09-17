import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/config", () => ({
  ADMIN_PASSWORD: "clave-duenos",
  STAFF_PASSWORD: "clave-equipo",
}));

const session: { value: string | undefined } = { value: undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (session.value ? { value: session.value } : undefined),
  }),
}));

import { PATCH } from "./route";
import { getSpots } from "@/db/spotsStore";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "pon-spots-api-"));
  process.env.PON_LOCAL_DATA_DIR = dir;
  session.value = undefined;
});

afterEach(() => {
  delete process.env.PON_LOCAL_DATA_DIR;
  rmSync(dir, { recursive: true, force: true });
});

function patch(id: string, body: unknown) {
  return PATCH(
    new NextRequest(`http://localhost/api/admin/spots/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("PATCH /api/admin/spots/[id]", () => {
  it("rejects a request with no session", async () => {
    const res = await patch("mesa-1", { blocked: true });
    expect(res.status).toBe(401);
    expect((await getSpots()).find((s) => s.id === "mesa-1")?.blocked).toBe(
      false,
    );
  });

  it("lets an employee block a table", async () => {
    session.value = "clave-equipo";
    const res = await patch("mesa-2", { blocked: true, reason: "ocupada" });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ status: "ok" });
    expect((await getSpots()).find((s) => s.id === "mesa-2")).toMatchObject({
      blocked: true,
      blockedReason: "ocupada",
    });
  });

  it("lets an owner unblock a table", async () => {
    session.value = "clave-duenos";
    await patch("barra-1", { blocked: true });
    const res = await patch("barra-1", { blocked: false });

    expect(res.status).toBe(200);
    expect((await getSpots()).find((s) => s.id === "barra-1")).toMatchObject({
      blocked: false,
      blockedReason: null,
    });
  });

  it("404s for a table that doesn't exist", async () => {
    session.value = "clave-equipo";
    expect((await patch("mesa-99", { blocked: true })).status).toBe(404);
  });

  it("rejects a malformed body", async () => {
    session.value = "clave-equipo";
    expect((await patch("mesa-1", { blocked: "si" })).status).toBe(400);
    expect(
      (await patch("mesa-1", { blocked: true, reason: "x".repeat(200) }))
        .status,
    ).toBe(400);
  });
});
