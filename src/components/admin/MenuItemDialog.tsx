"use client";

import { useRef, useState } from "react";
import type { AdminMenuCategory, MenuItemInput } from "@/lib/menu";
import { compressImage } from "@/lib/imageCompression";
import { formatCOP } from "@/lib/currency";
import AdminDialog, {
  adminInputClass,
  adminLabelClass,
} from "@/components/admin/AdminDialog";

export default function MenuItemDialog({
  initial,
  isNew,
  categories,
  onSave,
  onClose,
}: {
  initial: MenuItemInput;
  isNew: boolean;
  categories: AdminMenuCategory[];
  // Resolves true when saved, so the dialog knows to close.
  onSave: (input: MenuItemInput) => Promise<boolean>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(() => ({
    ...initial,
    nameEn: initial.nameEn ?? "",
    descEn: initial.descEn ?? "",
    subcategoryEs: initial.subcategoryEs ?? "",
    subcategoryEn: initial.subcategoryEn ?? "",
    price: initial.price == null ? "" : String(initial.price),
  }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const subcategoryOptions = [
    ...new Set(
      categories
        .find((c) => c.id === form.categoryId)
        ?.items.map((i) => i.subcategoryEs)
        .filter((s): s is string => Boolean(s)),
    ),
  ];

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setPhotoError(null);
    try {
      const { mimeType, base64Data } = await compressImage(file);
      const res = await fetch("/api/admin/menu/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType, base64Data }),
      });
      const body = (await res.json().catch(() => null)) as {
        url?: string;
      } | null;
      if (!res.ok || !body?.url)
        throw new Error(`upload failed: ${res.status}`);
      set("image", body.url);
    } catch (err) {
      console.error(err);
      setPhotoError(
        "No se pudo subir la foto. Usa una imagen JPG o PNG e intenta de nuevo.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const digits = form.price.replace(/\D/g, "");
    const ok = await onSave({
      ...form,
      nameEn: form.nameEn || null,
      descEn: form.descEn || null,
      subcategoryEs: form.subcategoryEs || null,
      subcategoryEn: form.subcategoryEn || null,
      price: digits ? Number(digits) : null,
    });
    setSaving(false);
    if (ok) onClose();
  }

  const priceDigits = form.price.replace(/\D/g, "");
  const busy = saving || uploading;

  return (
    <AdminDialog
      title={isNew ? "Nuevo producto" : "Editar producto"}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        {/* Photo */}
        <div>
          <span className={adminLabelClass}>Foto</span>
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 flex-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin preview, may be a freshly uploaded /api image
                <img
                  src={form.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-cream-muted flex h-full items-center justify-center text-xs">
                  Sin foto
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhoto}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="border-brass/40 text-brass-light rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {uploading
                  ? "Subiendo…"
                  : form.image
                    ? "Cambiar foto"
                    : "Subir foto"}
              </button>
              {form.image && (
                <button
                  type="button"
                  onClick={() => set("image", null)}
                  disabled={busy}
                  className="text-cream-muted hover:text-cream text-sm"
                >
                  Quitar foto
                </button>
              )}
            </div>
          </div>
          {photoError && (
            <p className="mt-2 text-sm text-[#e08a8a]" role="alert">
              {photoError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="item-name-es" className={adminLabelClass}>
            Nombre
          </label>
          <input
            id="item-name-es"
            value={form.nameEs}
            onChange={(e) => set("nameEs", e.target.value)}
            maxLength={120}
            required
            className={adminInputClass}
          />
        </div>

        <div>
          <label htmlFor="item-desc-es" className={adminLabelClass}>
            Descripción
          </label>
          <textarea
            id="item-desc-es"
            value={form.descEs}
            onChange={(e) => set("descEs", e.target.value)}
            maxLength={600}
            rows={3}
            className={adminInputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="item-price" className={adminLabelClass}>
              Precio (COP)
            </label>
            <input
              id="item-price"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="Ej: 45000"
              className={adminInputClass}
            />
            <p className="text-cream-muted mt-1 text-xs">
              {priceDigits
                ? formatCOP(Number(priceDigits))
                : "Vacío = no se muestra precio"}
            </p>
          </div>
          <div>
            <label htmlFor="item-category" className={adminLabelClass}>
              Categoría
            </label>
            <select
              id="item-category"
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={adminInputClass}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-obsidian">
                  {c.nameEs}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="item-subcategory-es" className={adminLabelClass}>
            Subgrupo (opcional)
          </label>
          <input
            id="item-subcategory-es"
            value={form.subcategoryEs}
            onChange={(e) => set("subcategoryEs", e.target.value)}
            maxLength={80}
            list="item-subcategory-options"
            placeholder="Ej: Botellas, Shots, Café…"
            className={adminInputClass}
          />
          <datalist id="item-subcategory-options">
            {subcategoryOptions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <label className="text-cream flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.available}
            onChange={(e) => set("available", e.target.checked)}
            className="accent-brass h-4 w-4"
          />
          Visible en la carta
        </label>

        <details className="rounded-xl border border-white/10 p-4">
          <summary className="text-cream-muted cursor-pointer text-sm">
            Traducción al inglés (opcional)
          </summary>
          <p className="text-cream-muted mt-2 text-xs">
            Lo que dejes vacío se muestra en español a los visitantes en inglés.
          </p>
          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="item-name-en" className={adminLabelClass}>
                Nombre en inglés
              </label>
              <input
                id="item-name-en"
                value={form.nameEn}
                onChange={(e) => set("nameEn", e.target.value)}
                maxLength={120}
                className={adminInputClass}
              />
            </div>
            <div>
              <label htmlFor="item-desc-en" className={adminLabelClass}>
                Descripción en inglés
              </label>
              <textarea
                id="item-desc-en"
                value={form.descEn}
                onChange={(e) => set("descEn", e.target.value)}
                maxLength={600}
                rows={3}
                className={adminInputClass}
              />
            </div>
            <div>
              <label htmlFor="item-subcategory-en" className={adminLabelClass}>
                Subgrupo en inglés
              </label>
              <input
                id="item-subcategory-en"
                value={form.subcategoryEn}
                onChange={(e) => set("subcategoryEn", e.target.value)}
                maxLength={80}
                className={adminInputClass}
              />
            </div>
          </div>
        </details>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-cream-muted hover:text-cream px-4 py-2.5 text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy || !form.nameEs.trim()}
            className="from-brass-light to-brass text-obsidian rounded-full bg-gradient-to-br px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}
