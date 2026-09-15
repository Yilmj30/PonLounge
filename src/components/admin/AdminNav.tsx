"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin/depositos", label: "Depósitos" },
  { href: "/admin/carta", label: "Carta" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.push("/admin");
    router.refresh();
  }

  return (
    <nav className="mb-10 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
      {LINKS.map((link) => {
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
      })}
      <button
        type="button"
        onClick={logout}
        className="text-cream-muted hover:text-cream ml-auto px-3 py-2 text-sm"
      >
        Salir
      </button>
    </nav>
  );
}
