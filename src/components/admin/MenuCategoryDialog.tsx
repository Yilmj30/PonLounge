"use client";

import { useState } from "react";
import type { MenuCategoryInput } from "@/lib/menu";
import AdminDialog, {
  adminInputClass,
  adminLabelClass,
} from "@/components/admin/AdminDialog";

export default function MenuCategoryDialog({
  initial,
  onSave,
  onClose,
}: {
  // Absent when creating a new category.
  initial?: MenuCategoryInput;
  onSave: (input: MenuCategoryInput) => Promise<boolean>;
  onClose: () => void;
}) {
  const [nameEs, setNameEs] = useState(initial?.nameEs ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await onSave({ nameEs, nameEn: nameEn || null });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <AdminDialog
      title={initial ? "Renombrar categoría" : "Nueva categoría"}
      onClose={onClose}
      busy={saving}
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label htmlFor="category-name-es" className={adminLabelClass}>
            Nombre
          </label>
          <input
            id="category-name-es"
            value={nameEs}
            onChange={(e) => setNameEs(e.target.value)}
            maxLength={80}
            required
            autoFocus
            className={adminInputClass}
          />
        </div>
        <div>
          <label htmlFor="category-name-en" className={adminLabelClass}>
            Nombre en inglés (opcional)
          </label>
          <input
            id="category-name-en"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            maxLength={80}
            placeholder="Si lo dejas vacío se muestra en español"
            className={adminInputClass}
          />
        </div>
        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-cream-muted hover:text-cream px-4 py-2.5 text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !nameEs.trim()}
            className="from-brass-light to-brass text-obsidian rounded-full bg-gradient-to-br px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}
