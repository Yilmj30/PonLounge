"use client";

import { useEffect, useRef } from "react";
import MenuItemPhoto from "@/components/MenuItemPhoto";
import { formatCOP } from "@/lib/currency";

export interface MenuItemDetail {
  name: string;
  desc: string;
  price?: number;
  image?: string;
}

// Accessible dialog for a menu item's "detailed" view (vs. the accordion
// card's summary view): traps focus, closes on Escape or backdrop click,
// and restores focus to whatever triggered it.
export default function MenuItemModal({
  item,
  onClose,
}: {
  item: MenuItemDetail;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-item-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-obsidian-soft border-brass/25 relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="text-cream hover:border-brass hover:text-brass-light absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[rgba(11,13,16,0.6)] backdrop-blur"
        >
          ✕
        </button>

        <MenuItemPhoto
          image={item.image}
          alt={item.name}
          className="aspect-[4/3] w-full rounded-none"
          sizes="(max-width: 640px) 100vw, 448px"
        />

        <div className="p-7">
          <h3
            id="menu-item-modal-title"
            className="font-display text-cream text-2xl"
          >
            {item.name}
          </h3>
          <p className="text-cream-muted mt-3 text-[15px] leading-relaxed">
            {item.desc}
          </p>
          {item.price != null && (
            <span className="border-brass/35 text-brass-light font-display mt-5 inline-block rounded-full border px-4 py-1.5 text-lg">
              {formatCOP(item.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
