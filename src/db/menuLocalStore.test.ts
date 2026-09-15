import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createLocalMenuCategory,
  createLocalMenuItem,
  deleteLocalMenuCategory,
  deleteLocalMenuItem,
  getLocalAdminMenu,
  getLocalMenuImage,
  moveLocalMenuCategory,
  moveLocalMenuItem,
  saveLocalMenuImage,
  updateLocalMenuCategory,
  updateLocalMenuItem,
} from "./menuLocalStore";
import {
  staticMenuSeed,
  toPublicMenu,
  teaserItems,
  type MenuItemInput,
} from "@/lib/menu";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "pon-menu-"));
  process.env.PON_LOCAL_DATA_DIR = dir;
});

afterEach(() => {
  delete process.env.PON_LOCAL_DATA_DIR;
  rmSync(dir, { recursive: true, force: true });
});

function itemInput(overrides: Partial<MenuItemInput> = {}): MenuItemInput {
  return {
    categoryId: "casa",
    nameEs: "Trago de prueba",
    nameEn: null,
    descEs: "Descripción",
    descEn: null,
    price: 40000,
    image: null,
    subcategoryEs: null,
    subcategoryEn: null,
    available: true,
    ...overrides,
  };
}

describe("menuLocalStore", () => {
  it("starts from the hand-written menu in src/data/menu.ts", async () => {
    const menu = await getLocalAdminMenu();
    const seed = staticMenuSeed();
    expect(menu.map((c) => c.id)).toEqual(seed.map((c) => c.id));
    expect(menu[0]!.items.length).toBe(seed[0]!.items.length);
  });

  it("creates an item at the end of its category", async () => {
    const result = await createLocalMenuItem(itemInput());
    expect(result.status).toBe("ok");

    const casa = (await getLocalAdminMenu()).find((c) => c.id === "casa")!;
    expect(casa.items.at(-1)?.nameEs).toBe("Trago de prueba");
  });

  it("rejects an item for a category that doesn't exist", async () => {
    const result = await createLocalMenuItem(
      itemInput({ categoryId: "no-existe" }),
    );
    expect(result.status).toBe("unknown_category");
  });

  it("updates price and moves an item to another category", async () => {
    const created = await createLocalMenuItem(itemInput());
    if (created.status !== "ok") throw new Error("setup failed");

    const updated = await updateLocalMenuItem(
      created.item.id,
      itemInput({ categoryId: "cafe", price: 12000 }),
    );
    expect(updated.status).toBe("ok");

    const menu = await getLocalAdminMenu();
    const cafe = menu.find((c) => c.id === "cafe")!;
    expect(cafe.items.at(-1)).toMatchObject({
      id: created.item.id,
      price: 12000,
    });
    expect(
      menu
        .find((c) => c.id === "casa")!
        .items.some((i) => i.id === created.item.id),
    ).toBe(false);
  });

  it("deletes an item and its uploaded photo", async () => {
    const url = await saveLocalMenuImage("image/jpeg", "ZmFrZQ==");
    const created = await createLocalMenuItem(itemInput({ image: url }));
    if (created.status !== "ok") throw new Error("setup failed");
    const imageId = url.split("/").at(-1)!;
    expect(await getLocalMenuImage(imageId)).not.toBeNull();

    expect((await deleteLocalMenuItem(created.item.id)).status).toBe("ok");
    expect(await getLocalMenuImage(imageId)).toBeNull();
    expect((await deleteLocalMenuItem(created.item.id)).status).toBe(
      "not_found",
    );
  });

  it("deletes the old uploaded photo when it's replaced", async () => {
    const oldUrl = await saveLocalMenuImage("image/jpeg", "b2xk");
    const newUrl = await saveLocalMenuImage("image/jpeg", "bmV3");
    const created = await createLocalMenuItem(itemInput({ image: oldUrl }));
    if (created.status !== "ok") throw new Error("setup failed");

    await updateLocalMenuItem(created.item.id, itemInput({ image: newUrl }));
    expect(await getLocalMenuImage(oldUrl.split("/").at(-1)!)).toBeNull();
    expect(await getLocalMenuImage(newUrl.split("/").at(-1)!)).not.toBeNull();
  });

  it("moves items up and down within their category", async () => {
    const before = (await getLocalAdminMenu())[0]!.items.map((i) => i.id);

    await moveLocalMenuItem(before[1]!, "up");
    const after = (await getLocalAdminMenu())[0]!.items.map((i) => i.id);
    expect(after.slice(0, 2)).toEqual([before[1], before[0]]);

    // Already first: no-op.
    await moveLocalMenuItem(before[1]!, "up");
    expect((await getLocalAdminMenu())[0]!.items.map((i) => i.id)).toEqual(
      after,
    );
  });

  it("creates, renames, reorders and deletes an empty category", async () => {
    const created = await createLocalMenuCategory({
      nameEs: "Cócteles de Temporada",
      nameEn: null,
    });
    if (created.status !== "ok") throw new Error("setup failed");
    expect(created.category.id).toBe("cocteles-de-temporada");

    await updateLocalMenuCategory(created.category.id, {
      nameEs: "Temporada",
      nameEn: "Seasonal",
    });
    await moveLocalMenuCategory(created.category.id, "up");

    const menu = await getLocalAdminMenu();
    expect(menu.at(-2)).toMatchObject({
      id: "cocteles-de-temporada",
      nameEs: "Temporada",
      nameEn: "Seasonal",
    });

    expect((await deleteLocalMenuCategory(created.category.id)).status).toBe(
      "ok",
    );
  });

  it("refuses to delete a category that still has items", async () => {
    expect((await deleteLocalMenuCategory("casa")).status).toBe(
      "category_not_empty",
    );
  });

  it("gives new categories a unique id", async () => {
    // The seed menu already has a "cafe" category.
    const first = await createLocalMenuCategory({
      nameEs: "Café",
      nameEn: null,
    });
    const second = await createLocalMenuCategory({
      nameEs: "Café",
      nameEn: null,
    });
    expect(first.status === "ok" && first.category.id).toBe("cafe-2");
    expect(second.status === "ok" && second.category.id).toBe("cafe-3");
  });
});

describe("toPublicMenu", () => {
  it("hides unavailable items and empty categories, falling back to Spanish", async () => {
    const [casa] = staticMenuSeed();
    const menu = toPublicMenu([
      {
        ...casa!,
        nameEn: null,
        items: casa!.items.map((i, index) => ({
          ...i,
          nameEn: null,
          available: index === 0,
        })),
      },
      { id: "vacia", nameEs: "Vacía", nameEn: null, sortOrder: 1, items: [] },
    ]);

    expect(menu).toHaveLength(1);
    expect(menu[0]!.en).toBe(casa!.nameEs);
    expect(menu[0]!.items).toHaveLength(1);
    expect(menu[0]!.items[0]!.name_en).toBe(casa!.items[0]!.nameEs);
  });
});

describe("teaserItems", () => {
  it("uses the house cocktails, or the first category if they're gone", () => {
    const menu = toPublicMenu(staticMenuSeed());
    expect(teaserItems(menu)[0]?.name_es).toBe(menu[0]!.items[0]!.name_es);
    expect(teaserItems(menu.filter((c) => c.id !== "casa"))[0]?.name_es).toBe(
      menu[1]!.items[0]!.name_es,
    );
  });
});
