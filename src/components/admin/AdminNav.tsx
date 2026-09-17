"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AdminRole } from "@/lib/adminAuth";

// Employees only see the deposits panel; editing the menu is for owners.
const LINKS: { href: string; label: string; ownerOnly?: boolean }[] = [
  { href: "/admin/depositos", label: "Depósitos" },
  { href: "/admin/carta", label: "Carta", ownerOnly: true },
];

export default function AdminNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.push("/admin");
    router.refresh();
  }

  return (
    <nav className="mb-10 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
      {LINKS.filter((link) => role === "owner" || !link.ownerOnly).map(
        (link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-brass/15 text-brass-light"
                  : "text-cream-muted hover:text-cream"
              }`}
            >
              {link.label}
            </Link>
          );
        },
      )}
      <span className="text-cream-muted ml-auto hidden text-xs sm:inline">
        {role === "owner" ? "Dueños" : "Equipo"}
      </span>
      <button
        type="button"
        onClick={logout}
        className="text-cream-muted hover:text-cream px-3 py-2 text-sm"
      >
        Salir
      </button>
    </nav>
  );
}
