// Single entry point for the editable menu (carta): what /carta and the
// home page render, and what /admin/carta edits.
//
// Picks a backend automatically, same as reservationsStore.ts: Postgres
// when DATABASE_URL / POSTGRES_URL is set, otherwise the local JSON file in
// menuLocalStore.ts.

import { and, asc, count, desc, eq, gt, lt, max } from "drizzle-orm";
import { getDb, hasRemoteDatabase } from "@/db/client";
import { menuCategories, menuImages, menuItems } from "@/db/schema";
import type { MenuCategory } from "@/data/menu";
import {
  isValidMenuImageId,
  menuImageUrl,
  slugify,
  splitMenu,
  staticMenuSeed,
  toPublicMenu,
  uniqueSlug,
  uploadedMenuImageId,
  type AdminMenuCategory,
  type AdminMenuItem,
  type MenuCategoryDeleteResult,
  type MenuCategoryInput,
  type MenuCategoryResult,
  type MenuDeleteResult,
  type MenuItemInput,
  type MenuItemResult,
  type MoveDirection,
} from "@/lib/menu";
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
} from "@/db/menuLocalStore";

function toAdminItem(row: typeof menuItems.$inferSelect): AdminMenuItem {
  return {
    id: row.id,
    categoryId: row.categoryId,
    nameEs: row.nameEs,
    nameEn: row.nameEn,
    descEs: row.descEs,
    descEn: row.descEn,
    price: row.price,
    image: row.image,
    subcategoryEs: row.subcategoryEs,
    subcategoryEn: row.subcategoryEn,
    available: row.available,
    sortOrder: row.sortOrder,
  };
}

function toAdminCategory(row: typeof menuCategories.$inferSelect) {
  return {
    id: row.id,
    nameEs: row.nameEs,
    nameEn: row.nameEn,
    sortOrder: row.sortOrder,
  };
}

async function categoryExists(id: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: menuCategories.id })
    .from(menuCategories)
    .where(eq(menuCategories.id, id))
    .limit(1);
  return rows.length > 0;
}

async function nextItemSortOrder(categoryId: string): Promise<number> {
  const [row] = await getDb()
    .select({ value: max(menuItems.sortOrder) })
    .from(menuItems)
    .where(eq(menuItems.categoryId, categoryId));
  return row?.value == null ? 0 : row.value + 1;
}

async function deleteUploadedImage(image: string | null) {
  const id = uploadedMenuImageId(image);
  if (id) await getDb().delete(menuImages).where(eq(menuImages.id, id));
}

// --- Reads ---

export async function getAdminMenu(): Promise<AdminMenuCategory[]> {
  if (!hasRemoteDatabase()) return getLocalAdminMenu();

  const db = getDb();
  const [categories, items] = await Promise.all([
    db.select().from(menuCategories).orderBy(asc(menuCategories.sortOrder)),
    db.select().from(menuItems).orderBy(asc(menuItems.sortOrder)),
  ]);

  return categories.map((c) => ({
    ...toAdminCategory(c),
    items: items.filter((i) => i.categoryId === c.id).map(toAdminItem),
  }));
}

// What the public site renders. If the database is unreachable, the site
// still shows the hand-written menu rather than an error page.
export async function getPublicMenu(): Promise<MenuCategory[]> {
  try {
    return toPublicMenu(await getAdminMenu());
  } catch (err) {
    console.error("getPublicMenu failed, using the static menu:", err);
    return toPublicMenu(staticMenuSeed());
  }
}

// --- Items ---

export async function createMenuItem(
  input: MenuItemInput,
): Promise<MenuItemResult> {
  if (!hasRemoteDatabase()) return createLocalMenuItem(input);

  if (!(await categoryExists(input.categoryId))) {
    return { status: "unknown_category" };
  }
  const [row] = await getDb()
    .insert(menuItems)
    .values({
      ...input,
      sortOrder: await nextItemSortOrder(input.categoryId),
    })
    .returning();
  return { status: "ok", item: toAdminItem(row!) };
}

export async function updateMenuItem(
  id: string,
  input: MenuItemInput,
): Promise<MenuItemResult> {
  if (!hasRemoteDatabase()) return updateLocalMenuItem(id, input);

  const db = getDb();
  const [existing] = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.id, id))
    .limit(1);
  if (!existing) return { status: "not_found" };
  if (!(await categoryExists(input.categoryId))) {
    return { status: "unknown_category" };
  }

  const sortOrder =
    existing.categoryId === input.categoryId
      ? existing.sortOrder
      : await nextItemSortOrder(input.categoryId);

  const [row] = await db
    .update(menuItems)
    .set({ ...input, sortOrder, updatedAt: new Date() })
    .where(eq(menuItems.id, id))
    .returning();
  if (!row) return { status: "not_found" };

  if (existing.image !== input.image) await deleteUploadedImage(existing.image);
  return { status: "ok", item: toAdminItem(row) };
}

export async function deleteMenuItem(id: string): Promise<MenuDeleteResult> {
  if (!hasRemoteDatabase()) return deleteLocalMenuItem(id);

  const [row] = await getDb()
    .delete(menuItems)
    .where(eq(menuItems.id, id))
    .returning({ image: menuItems.image });
  if (!row) return { status: "not_found" };
  await deleteUploadedImage(row.image);
  return { status: "ok" };
}

export async function moveMenuItem(
  id: string,
  direction: MoveDirection,
): Promise<MenuDeleteResult> {
  if (!hasRemoteDatabase()) return moveLocalMenuItem(id, direction);

  const db = getDb();
  const [item] = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.id, id))
    .limit(1);
  if (!item) return { status: "not_found" };

  const [neighbour] = await db
    .select()
    .from(menuItems)
    .where(
      and(
        eq(menuItems.categoryId, item.categoryId),
        direction === "up"
          ? lt(menuItems.sortOrder, item.sortOrder)
          : gt(menuItems.sortOrder, item.sortOrder),
      ),
    )
    .orderBy(
      direction === "up" ? desc(menuItems.sortOrder) : asc(menuItems.sortOrder),
    )
    .limit(1);
  if (!neighbour) return { status: "ok" };

  // batch() runs both updates in one transaction.
  await db.batch([
    db
      .update(menuItems)
      .set({ sortOrder: neighbour.sortOrder })
      .where(eq(menuItems.id, item.id)),
    db
      .update(menuItems)
      .set({ sortOrder: item.sortOrder })
      .where(eq(menuItems.id, neighbour.id)),
  ]);
  return { status: "ok" };
}

// --- Categories ---

export async function createMenuCategory(
  input: MenuCategoryInput,
): Promise<MenuCategoryResult> {
  if (!hasRemoteDatabase()) return createLocalMenuCategory(input);

  const db = getDb();
  const existing = await db
    .select({ id: menuCategories.id, sortOrder: menuCategories.sortOrder })
    .from(menuCategories);
  const [row] = await db
    .insert(menuCategories)
    .values({
      id: uniqueSlug(slugify(input.nameEs), new Set(existing.map((c) => c.id))),
      nameEs: input.nameEs,
      nameEn: input.nameEn,
      sortOrder: existing.length
        ? Math.max(...existing.map((c) => c.sortOrder)) + 1
        : 0,
    })
    .returning();
  return { status: "ok", category: toAdminCategory(row!) };
}

export async function updateMenuCategory(
  id: string,
  input: MenuCategoryInput,
): Promise<MenuCategoryResult> {
  if (!hasRemoteDatabase()) return updateLocalMenuCategory(id, input);

  const [row] = await getDb()
    .update(menuCategories)
    .set({ nameEs: input.nameEs, nameEn: input.nameEn, updatedAt: new Date() })
    .where(eq(menuCategories.id, id))
    .returning();
  return row
    ? { status: "ok", category: toAdminCategory(row) }
    : { status: "not_found" };
}

// Only empty categories can be deleted, so a misclick can't wipe out a
// whole section of the menu.
export async function deleteMenuCategory(
  id: string,
): Promise<MenuCategoryDeleteResult> {
  if (!hasRemoteDatabase()) return deleteLocalMenuCategory(id);

  const db = getDb();
  const [row] = await db
    .select({ items: count() })
    .from(menuItems)
    .where(eq(menuItems.categoryId, id));
  if (row && row.items > 0) return { status: "category_not_empty" };

  const deleted = await db
    .delete(menuCategories)
    .where(eq(menuCategories.id, id))
    .returning({ id: menuCategories.id });
  return { status: deleted.length ? "ok" : "not_found" };
}

export async function moveMenuCategory(
  id: string,
  direction: MoveDirection,
): Promise<MenuDeleteResult> {
  if (!hasRemoteDatabase()) return moveLocalMenuCategory(id, direction);

  const db = getDb();
  const [category] = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.id, id))
    .limit(1);
  if (!category) return { status: "not_found" };

  const [neighbour] = await db
    .select()
    .from(menuCategories)
    .where(
      direction === "up"
        ? lt(menuCategories.sortOrder, category.sortOrder)
        : gt(menuCategories.sortOrder, category.sortOrder),
    )
    .orderBy(
      direction === "up"
        ? desc(menuCategories.sortOrder)
        : asc(menuCategories.sortOrder),
    )
    .limit(1);
  if (!neighbour) return { status: "ok" };

  await db.batch([
    db
      .update(menuCategories)
      .set({ sortOrder: neighbour.sortOrder })
      .where(eq(menuCategories.id, category.id)),
    db
      .update(menuCategories)
      .set({ sortOrder: category.sortOrder })
      .where(eq(menuCategories.id, neighbour.id)),
  ]);
  return { status: "ok" };
}

// --- Photos ---

// Returns the URL to store in the item's `image`.
export async function saveMenuImage(
  mimeType: string,
  base64Data: string,
): Promise<string> {
  if (!hasRemoteDatabase()) return saveLocalMenuImage(mimeType, base64Data);

  const [row] = await getDb()
    .insert(menuImages)
    .values({
      mimeType,
      base64Data,
      sizeBytes: Buffer.byteLength(base64Data, "base64"),
    })
    .returning({ id: menuImages.id });
  return menuImageUrl(row!.id);
}

export async function getMenuImage(
  id: string,
): Promise<{ mimeType: string; base64Data: string } | null> {
  if (!isValidMenuImageId(id)) return null;
  if (!hasRemoteDatabase()) return getLocalMenuImage(id);

  const [row] = await getDb()
    .select({
      mimeType: menuImages.mimeType,
      base64Data: menuImages.base64Data,
    })
    .from(menuImages)
    .where(eq(menuImages.id, id))
    .limit(1);
  return row ?? null;
}

// --- Seeding (Postgres only; the local store seeds itself on first read) ---

// Copies src/data/menu.ts into the database the first time only — once the
// owners have a menu there, re-running `npm run db:seed` never overwrites
// their edits.
export async function seedMenuIfEmpty(): Promise<"seeded" | "skipped"> {
  const db = getDb();
  const [row] = await db.select({ n: count() }).from(menuCategories);
  if (row && row.n > 0) return "skipped";

  const { categories, items } = splitMenu(staticMenuSeed());
  await db.insert(menuCategories).values(categories);
  // The seed's "seed-casa-0"-style ids aren't uuids — let Postgres generate
  // real ones (drizzle sends DEFAULT for undefined).
  const rows = items.map((item) => ({ ...item, id: undefined }));
  for (let i = 0; i < rows.length; i += 100) {
    await db.insert(menuItems).values(rows.slice(i, i + 100));
  }
  return "seeded";
}
