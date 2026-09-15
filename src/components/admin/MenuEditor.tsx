"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminMenuCategory,
  AdminMenuItem,
  MenuCategoryInput,
  MenuItemInput,
  MoveDirection,
} from "@/lib/menu";
import { formatCOP } from "@/lib/currency";
import MenuItemDialog from "@/components/admin/MenuItemDialog";
import MenuCategoryDialog from "@/components/admin/MenuCategoryDialog";

type ItemDialogState =
  | { mode: "create"; categoryId: string }
  | { mode: "edit"; item: AdminMenuItem };

type CategoryDialogState =
  { mode: "create" } | { mode: "edit"; category: AdminMenuCategory };

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Tu sesión expiró. Recarga la página y vuelve a entrar.",
  category_not_empty:
    "Esa categoría todavía tiene productos. Muévelos o elimínalos primero.",
  not_found: "Ese elemento ya no existe. Recarga la página.",
  unknown_category: "La categoría elegida ya no existe. Recarga la página.",
  invalid_input: "Revisa los datos: hay un campo vacío o demasiado largo.",
};

function toInput(item: AdminMenuItem): MenuItemInput {
  return {
    categoryId: item.categoryId,
    nameEs: item.nameEs,
    nameEn: item.nameEn,
    descEs: item.descEs,
    descEn: item.descEn,
    price: item.price,
    image: item.image,
    subcategoryEs: item.subcategoryEs,
    subcategoryEn: item.subcategoryEn,
    available: item.available,
  };
}

function emptyItem(categoryId: string): MenuItemInput {
  return {
    categoryId,
    nameEs: "",
    nameEn: null,
    descEs: "",
    descEn: null,
    price: null,
    image: null,
    subcategoryEs: null,
    subcategoryEn: null,
    available: true,
  };
}

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const iconButton =
  "text-cream-muted hover:text-cream rounded-md px-2 py-1 text-sm disabled:opacity-30";

export default function MenuEditor({
  categories,
}: {
  categories: AdminMenuCategory[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [itemDialog, setItemDialog] = useState<ItemDialogState | null>(null);
  const [categoryDialog, setCategoryDialog] =
    useState<CategoryDialogState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sends a change to the API and reloads the server-rendered menu on
  // success. Returns whether it worked, so dialogs know to close.
  async function send(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: unknown,
  ): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          status?: string;
        } | null;
        const reason = data?.status ?? data?.error ?? "";
        setError(
          ERROR_MESSAGES[reason] ?? "No se pudo guardar. Intenta de nuevo.",
        );
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Sin conexión. Revisa el internet e intenta de nuevo.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const itemUrl = (id: string) =>
    `/api/admin/menu/items/${encodeURIComponent(id)}`;
  const categoryUrl = (id: string) =>
    `/api/admin/menu/categories/${encodeURIComponent(id)}`;

  function saveItem(input: MenuItemInput) {
    if (!itemDialog) return Promise.resolve(false);
    return itemDialog.mode === "create"
      ? send("/api/admin/menu/items", "POST", input)
      : send(itemUrl(itemDialog.item.id), "PATCH", input);
  }

  function saveCategory(input: MenuCategoryInput) {
    if (!categoryDialog) return Promise.resolve(false);
    return categoryDialog.mode === "create"
      ? send("/api/admin/menu/categories", "POST", input)
      : send(categoryUrl(categoryDialog.category.id), "PATCH", input);
  }

  function deleteItem(item: AdminMenuItem) {
    if (!window.confirm(`¿Eliminar "${item.nameEs}"? No se puede deshacer.`)) {
      return;
    }
    void send(itemUrl(item.id), "DELETE");
  }

  function deleteCategory(category: AdminMenuCategory) {
    if (category.items.length > 0) {
      setError(ERROR_MESSAGES.category_not_empty!);
      return;
    }
    if (!window.confirm(`¿Eliminar la categoría "${category.nameEs}"?`)) {
      return;
    }
    void send(categoryUrl(category.id), "DELETE");
  }

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const search = normalize(query.trim());
  const visibleCategories = categories
    .map((category) => ({
      category,
      items: search
        ? category.items.filter((i) => normalize(i.nameEs).includes(search))
        : category.items,
    }))
    .filter(({ items }) => !search || items.length > 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto…"
          aria-label="Buscar producto"
          className="text-cream min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none focus:border-white/30"
        />
        <button
          type="button"
          onClick={() => setCategoryDialog({ mode: "create" })}
          disabled={busy}
          className="border-brass/40 text-brass-light rounded-full border px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          + Nueva categoría
        </button>
        <a
          href="/carta"
          target="_blank"
          rel="noreferrer"
          className="text-cream-muted hover:text-cream px-2 py-2.5 text-sm"
        >
          Ver carta ↗
        </a>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-[#e08a8a]/35 bg-[#e08a8a]/[0.08] p-4 text-sm text-[#e08a8a]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {search && visibleCategories.length === 0 && (
        <p className="text-cream-muted text-center text-sm">
          Ningún producto coincide con “{query}”.
        </p>
      )}

      <div className="grid gap-3">
        {visibleCategories.map(({ category, items }, index) => {
          const open = Boolean(search) || openIds.has(category.id);
          const hidden = category.items.filter((i) => !i.available).length;

          return (
            <section
              key={category.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              <div className="flex flex-wrap items-center gap-2 p-4">
                <button
                  type="button"
                  onClick={() => toggle(category.id)}
                  aria-expanded={open}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    aria-hidden="true"
                    className={`text-brass transition-transform ${open ? "rotate-90" : ""}`}
                  >
                    ▸
                  </span>
                  <span className="font-display text-cream truncate text-lg">
                    {category.nameEs}
                  </span>
                  <span className="text-cream-muted flex-none text-xs">
                    {category.items.length} productos
                    {hidden > 0 && ` · ${hidden} ocultos`}
                  </span>
                </button>
                {!search && (
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() =>
                        send(`${categoryUrl(category.id)}/move`, "POST", {
                          direction: "up" satisfies MoveDirection,
                        })
                      }
                      disabled={busy || index === 0}
                      aria-label={`Subir ${category.nameEs}`}
                      className={iconButton}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        send(`${categoryUrl(category.id)}/move`, "POST", {
                          direction: "down" satisfies MoveDirection,
                        })
                      }
                      disabled={busy || index === visibleCategories.length - 1}
                      aria-label={`Bajar ${category.nameEs}`}
                      className={iconButton}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCategoryDialog({ mode: "edit", category })
                      }
                      disabled={busy}
                      className={iconButton}
                    >
                      Renombrar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(category)}
                      disabled={busy}
                      className={`${iconButton} hover:text-[#e08a8a]`}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>

              {open && (
                <div className="border-t border-white/10 px-4 pb-4">
                  <ul className="divide-y divide-white/5">
                    {items.map((item, itemIndex) => (
                      <li
                        key={item.id}
                        className={`flex flex-wrap items-center gap-3 py-3 ${item.available ? "" : "opacity-55"}`}
                      >
                        <div className="h-12 w-12 flex-none overflow-hidden rounded-lg bg-white/[0.06]">
                          {item.image && (
                            // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
                            <img
                              src={item.image}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-cream truncate text-sm font-semibold">
                            {item.nameEs}
                            {!item.available && (
                              <span className="text-cream-muted ml-2 text-xs font-normal">
                                (oculto)
                              </span>
                            )}
                          </p>
                          <p className="text-cream-muted truncate text-xs">
                            {item.price != null
                              ? formatCOP(item.price)
                              : "Sin precio"}
                            {item.subcategoryEs && ` · ${item.subcategoryEs}`}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {!search && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  send(`${itemUrl(item.id)}/move`, "POST", {
                                    direction: "up" satisfies MoveDirection,
                                  })
                                }
                                disabled={busy || itemIndex === 0}
                                aria-label={`Subir ${item.nameEs}`}
                                className={iconButton}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  send(`${itemUrl(item.id)}/move`, "POST", {
                                    direction: "down" satisfies MoveDirection,
                                  })
                                }
                                disabled={
                                  busy || itemIndex === items.length - 1
                                }
                                aria-label={`Bajar ${item.nameEs}`}
                                className={iconButton}
                              >
                                ↓
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              send(itemUrl(item.id), "PATCH", {
                                ...toInput(item),
                                available: !item.available,
                              })
                            }
                            disabled={busy}
                            className={iconButton}
                          >
                            {item.available ? "Ocultar" : "Mostrar"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setItemDialog({ mode: "edit", item })
                            }
                            disabled={busy}
                            className={`${iconButton} text-brass-light`}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(item)}
                            disabled={busy}
                            aria-label={`Eliminar ${item.nameEs}`}
                            className={`${iconButton} hover:text-[#e08a8a]`}
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {!search && (
                    <button
                      type="button"
                      onClick={() =>
                        setItemDialog({
                          mode: "create",
                          categoryId: category.id,
                        })
                      }
                      disabled={busy}
                      className="text-brass-light mt-3 text-sm font-semibold disabled:opacity-50"
                    >
                      + Agregar producto
                    </button>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {itemDialog && (
        <MenuItemDialog
          key={
            itemDialog.mode === "edit"
              ? itemDialog.item.id
              : `new-${itemDialog.categoryId}`
          }
          initial={
            itemDialog.mode === "edit"
              ? toInput(itemDialog.item)
              : emptyItem(itemDialog.categoryId)
          }
          isNew={itemDialog.mode === "create"}
          categories={categories}
          onSave={saveItem}
          onClose={() => setItemDialog(null)}
        />
      )}

      {categoryDialog && (
        <MenuCategoryDialog
          initial={
            categoryDialog.mode === "edit"
              ? {
                  nameEs: categoryDialog.category.nameEs,
                  nameEn: categoryDialog.category.nameEn,
                }
              : undefined
          }
          onSave={saveCategory}
          onClose={() => setCategoryDialog(null)}
        />
      )}
    </div>
  );
}
