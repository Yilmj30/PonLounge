// Local, file-simulated menu store — used automatically whenever
// DATABASE_URL/POSTGRES_URL isn't set (see menuStore.ts), same pattern as
// localStore.ts for reservations. Until the owners edit something, it just
// serves the hand-written menu from src/data/menu.ts; the first edit writes
// .data/local-menu.json and that file is the source of truth from then on.
// Uploaded photos go to .data/menu-images/<id>.json.

import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  isValidMenuImageId,
  menuImageUrl,
  nextSortOrder,
  slugify,
  splitMenu,
  staticMenuSeed,
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

type StoredCategory = Omit<AdminMenuCategory, "items">;
type StoreData = { categories: StoredCategory[]; items: AdminMenuItem[] };

// Resolved per call (not at import) so tests can point it at a temp dir
// instead of wiping the developer's real .data/ folder.
function dataDir(): string {
  return process.env.PON_LOCAL_DATA_DIR ?? path.join(process.cwd(), ".data");
}

function dataFile(): string {
  return path.join(dataDir(), "local-menu.json");
}

function imageFile(id: string): string {
  return path.join(dataDir(), "menu-images", `${id}.json`);
}

function load(): StoreData {
  try {
    return JSON.parse(readFileSync(dataFile(), "utf-8")) as StoreData;
  } catch {
    return splitMenu(staticMenuSeed());
  }
}

function persist(data: StoreData) {
  mkdirSync(dataDir(), { recursive: true });
  writeFileSync(dataFile(), JSON.stringify(data, null, 2), "utf-8");
}

// Every mutation is read-modify-write on one file, so run them one at a
// time — two concurrent saves would otherwise overwrite each other.
let queue: Promise<unknown> = Promise.resolve();

function mutate<T>(fn: (data: StoreData) => T): Promise<T> {
  const run = queue.then(() => {
    const data = load();
    const result = fn(data);
    persist(data);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

function bySortOrder(a: { sortOrder: number }, b: { sortOrder: number }) {
  return a.sortOrder - b.sortOrder;
}

function deleteImageFile(image: string | null) {
  const id = uploadedMenuImageId(image);
  if (id) rmSync(imageFile(id), { force: true });
}

// Swaps sortOrder with the neighbour in the given direction; no-op at
// either end of the list.
function swapWithNeighbour(
  list: { id: string; sortOrder: number }[],
  id: string,
  direction: MoveDirection,
) {
  const sorted = [...list].sort(bySortOrder);
  const index = sorted.findIndex((x) => x.id === id);
  const neighbour = sorted[direction === "up" ? index - 1 : index + 1];
  const current = sorted[index];
  if (!current || !neighbour) return;
  [current.sortOrder, neighbour.sortOrder] = [
    neighbour.sortOrder,
    current.sortOrder,
  ];
}

export async function getLocalAdminMenu(): Promise<AdminMenuCategory[]> {
  const data = load();
  return [...data.categories].sort(bySortOrder).map((c) => ({
    ...c,
    items: data.items.filter((i) => i.categoryId === c.id).sort(bySortOrder),
  }));
}

export function createLocalMenuItem(
  input: MenuItemInput,
): Promise<MenuItemResult> {
  return mutate((data) => {
    if (!data.categories.some((c) => c.id === input.categoryId)) {
      return { status: "unknown_category" };
    }
    const item: AdminMenuItem = {
      ...input,
      id: randomUUID(),
      sortOrder: nextSortOrder(
        data.items
          .filter((i) => i.categoryId === input.categoryId)
          .map((i) => i.sortOrder),
      ),
    };
    data.items.push(item);
    return { status: "ok", item };
  });
}

export function updateLocalMenuItem(
  id: string,
  input: MenuItemInput,
): Promise<MenuItemResult> {
  return mutate((data) => {
    const item = data.items.find((i) => i.id === id);
    if (!item) return { status: "not_found" };
    if (!data.categories.some((c) => c.id === input.categoryId)) {
      return { status: "unknown_category" };
    }
    if (item.image !== input.image) deleteImageFile(item.image);
    if (item.categoryId !== input.categoryId) {
      item.sortOrder = nextSortOrder(
        data.items
          .filter((i) => i.categoryId === input.categoryId)
          .map((i) => i.sortOrder),
      );
    }
    Object.assign(item, input);
    return { status: "ok", item };
  });
}

export function deleteLocalMenuItem(id: string): Promise<MenuDeleteResult> {
  return mutate((data) => {
    const index = data.items.findIndex((i) => i.id === id);
    if (index === -1) return { status: "not_found" };
    const [removed] = data.items.splice(index, 1);
    deleteImageFile(removed!.image);
    return { status: "ok" };
  });
}

export function moveLocalMenuItem(
  id: string,
  direction: MoveDirection,
): Promise<MenuDeleteResult> {
  return mutate((data) => {
    const item = data.items.find((i) => i.id === id);
    if (!item) return { status: "not_found" };
    swapWithNeighbour(
      data.items.filter((i) => i.categoryId === item.categoryId),
      id,
      direction,
    );
    return { status: "ok" };
  });
}

export function createLocalMenuCategory(
  input: MenuCategoryInput,
): Promise<MenuCategoryResult> {
  return mutate((data) => {
    const category: StoredCategory = {
      id: uniqueSlug(
        slugify(input.nameEs),
        new Set(data.categories.map((c) => c.id)),
      ),
      nameEs: input.nameEs,
      nameEn: input.nameEn,
      sortOrder: nextSortOrder(data.categories.map((c) => c.sortOrder)),
    };
    data.categories.push(category);
    return { status: "ok", category };
  });
}

export function updateLocalMenuCategory(
  id: string,
  input: MenuCategoryInput,
): Promise<MenuCategoryResult> {
  return mutate((data) => {
    const category = data.categories.find((c) => c.id === id);
    if (!category) return { status: "not_found" };
    category.nameEs = input.nameEs;
    category.nameEn = input.nameEn;
    return { status: "ok", category };
  });
}

export function deleteLocalMenuCategory(
  id: string,
): Promise<MenuCategoryDeleteResult> {
  return mutate((data) => {
    const index = data.categories.findIndex((c) => c.id === id);
    if (index === -1) return { status: "not_found" };
    if (data.items.some((i) => i.categoryId === id)) {
      return { status: "category_not_empty" };
    }
    data.categories.splice(index, 1);
    return { status: "ok" };
  });
}

export function moveLocalMenuCategory(
  id: string,
  direction: MoveDirection,
): Promise<MenuDeleteResult> {
  return mutate((data) => {
    if (!data.categories.some((c) => c.id === id)) {
      return { status: "not_found" };
    }
    swapWithNeighbour(data.categories, id, direction);
    return { status: "ok" };
  });
}

export async function saveLocalMenuImage(
  mimeType: string,
  base64Data: string,
): Promise<string> {
  const id = randomUUID();
  mkdirSync(path.dirname(imageFile(id)), { recursive: true });
  writeFileSync(imageFile(id), JSON.stringify({ mimeType, base64Data }));
  return menuImageUrl(id);
}

export async function getLocalMenuImage(
  id: string,
): Promise<{ mimeType: string; base64Data: string } | null> {
  if (!isValidMenuImageId(id) || !existsSync(imageFile(id))) return null;
  try {
    return JSON.parse(readFileSync(imageFile(id), "utf-8"));
  } catch {
    return null;
  }
}
