"use client";

import { useEffect, useId, useRef } from "react";

export const adminInputClass =
  "text-cream w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-white/30";
export const adminLabelClass =
  "text-cream-muted mb-1.5 block text-xs tracking-[0.06em] uppercase";

// Modal shell for the /admin/carta forms: closes on Escape or backdrop
// click (unless a save is in progress) and focuses itself on open.
export default function AdminDialog({
  title,
  onClose,
  busy = false,
  children,
}: {
  title: string;
  onClose: () => void;
  busy?: boolean;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:py-12"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-obsidian-soft w-full max-w-lg rounded-2xl border border-white/10 p-6 outline-none"
      >
        <h2 id={titleId} className="font-display text-cream mb-5 text-xl">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
