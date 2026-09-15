"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin/depositos");
        router.refresh();
        return;
      }
      setError("Clave incorrecta.");
    } catch {
      setError("Algo salió mal. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-sm gap-4">
      <div>
        <label
          htmlFor="admin-password"
          className="text-cream-muted mb-1.5 block text-xs tracking-[0.06em] uppercase"
        >
          Clave del equipo
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="text-cream w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-white/30"
        />
      </div>
      {error && (
        <p className="text-sm text-[#e08a8a]" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !password}
        className="from-brass-light to-brass text-obsidian rounded-full bg-gradient-to-br px-6 py-3 text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
