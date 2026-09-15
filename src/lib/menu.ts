// Shared types and pure helpers for the editable menu (carta). Used by both
// menu store backends (Postgres and the local JSON file), the admin API
// routes, and the /admin/carta editor.

import { cocktailMenu, menu, type MenuCategory } from "@/data/menu";

export type AdminMenuItem = {
  id: string;
  categoryId: string;
  nameEs: string;
  nameEn: string | null;
  descEs: string;
  descEn: string | null;
  price: number | null;
  image: string | null;
  subcategoryEs: string | null;
  subcategoryEn: string | null;
  available: boolean;
  sortOrder: number;
};

export type AdminMenuCategory = {
  id: string;
  nameEs: string;
  nameEn: string | null;
  sortOrder: number;
  items: AdminMenuItem[];
};

export type MenuItemInput = Omit<AdminMenuItem, "id" | "sortOrder">;
export type MenuCategoryInput = { nameEs: string; nameEn: string | null };
export type MoveDirection = "up" | "down";

export type MenuItemResult =
  | { status: "ok"; item: AdminMenuItem }
  | { status: "not_found" | "unknown_category" };
export type MenuCategoryResult =
  | { status: "ok"; category: Omit<AdminMenuCategory, "items"> }
  | { status: "not_found" };
export type MenuDeleteResult = { status: "ok" | "not_found" };
export type MenuCategoryDeleteResult = {
  status: "ok" | "not_found" | "category_not_empty";
};

// Uploaded photos are served from here; anything else in `image` is a
// static file under /public that must not be deleted.
export const MENU_IMAGE_URL_PREFIX = "/api/menu-images/";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isValidMenuImageId(id: string): boolean {
  return UUID_PATTERN.test(id);
}

export function menuImageUrl(id: string): string {
  return `${MENU_IMAGE_URL_PREFIX}${id}`;
}

// Returns the uploaded image id behind a menu item's `image`, or null for a
// static /public path (or no image).
export function uploadedMenuImageId(image: string | null): string | null {
  if (!image?.startsWith(MENU_IMAGE_URL_PREFIX)) return null;
  const id = image.slice(MENU_IMAGE_URL_PREFIX.length);
  return isValidMenuImageId(id) ? id : null;
}

// "Cócteles de la Casa" -> "cocteles-de-la-casa". Callers add a numeric
// suffix on collision.
export function slugify(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "categoria";
}

export function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

export function nextSortOrder(orders: number[]): number {
  return orders.length ? Math.max(...orders) + 1 : 0;
}

// Shape the public site renders (the same MenuCategory the static menu.ts
// used), hiding unavailable items and empty categories, and falling back to
// Spanish wherever an English translation wasn't filled in.
export function toPublicMenu(categories: AdminMenuCategory[]): MenuCategory[] {
  return categories
    .map((c) => ({
      id: c.id,
      es: c.nameEs,
      en: c.nameEn || c.nameEs,
      items: c.items
        .filter((i) => i.available)
        .map((i) => ({
          id: i.id,
          name_es: i.nameEs,
          name_en: i.nameEn || i.nameEs,
          desc_es: i.descEs,
          desc_en: i.descEn || i.descEs,
          price: i.price ?? undefined,
          image: i.image ?? undefined,
          subcategory_es: i.subcategoryEs ?? undefined,
          subcategory_en: i.subcategoryEn || i.subcategoryEs || undefined,
        })),
    }))
    .filter((c) => c.items.length > 0);
}

// The hand-written menu in src/data/menu.ts, converted to the editable
// shape — the starting point both stores are seeded with. Item ids are
// deterministic so the local store gets stable ids even before its file is
// first written; Postgres generates its own uuids instead.
export function staticMenuSeed(): AdminMenuCategory[] {
  return [...cocktailMenu, ...menu].map((c, categoryIndex) => ({
    id: c.id,
    nameEs: c.es,
    nameEn: c.en,
    sortOrder: categoryIndex,
    items: c.items.map((i, itemIndex) => ({
      id: `seed-${c.id}-${itemIndex}`,
      categoryId: c.id,
      nameEs: i.name_es,
      nameEn: i.name_en,
      descEs: i.desc_es,
      descEn: i.desc_en,
      price: i.price ?? null,
      image: i.image ?? null,
      subcategoryEs: i.subcategory_es ?? null,
      subcategoryEn: i.subcategory_en ?? null,
      available: true,
      sortOrder: itemIndex,
    })),
  }));
}

// Flattens the nested shape into the two rows-lists the stores persist.
export function splitMenu(categories: AdminMenuCategory[]) {
  return {
    categories: categories.map((c) => ({
      id: c.id,
      nameEs: c.nameEs,
      nameEn: c.nameEn,
      sortOrder: c.sortOrder,
    })),
    items: categories.flatMap((c) => c.items),
  };
}

// Home page teaser: cocktails with a real photo, house creations first —
// falls through into the other categories (in menu order) so the teaser
// still shows a full row even while most of the house category has no
// photo yet. Only items with a photo are eligible at all, to avoid the
// branded placeholder showing up here.
export function teaserItems(categories: MenuCategory[], limit = 5) {
  return categories
    .flatMap((c) => c.items)
    .filter((item) => item.image)
    .slice(0, limit);
}
