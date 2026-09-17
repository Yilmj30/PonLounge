"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VenueSpot } from "@/lib/spots";
import AdminDialog, {
  adminInputClass,
  adminLabelClass,
} from "@/components/admin/AdminDialog";

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Tu sesión expiró. Recarga la página y vuelve a entrar.",
  not_found: "Esa mesa ya no existe. Recarga la página.",
  invalid_input: "El motivo es demasiado largo.",
};

export default function SpotsPanel({
  spots,
  reservedToday,
}: {
  spots: VenueSpot[];
  // Confirmed reservations for today, so the panel can show what's left.
  reservedToday: number;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocking, setBlocking] = useState<VenueSpot | null>(null);
  const [reason, setReason] = useState("");

  async function setBlocked(
    spot: VenueSpot,
    blocked: boolean,
    note: string | null,
  ): Promise<boolean> {
    setBusyId(spot.id);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/spots/${encodeURIComponent(spot.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocked, reason: note }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          status?: string;
        } | null;
        const reasonKey = data?.status ?? data?.error ?? "";
        setError(
          ERROR_MESSAGES[reasonKey] ?? "No se pudo guardar. Intenta de nuevo.",
        );
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Sin conexión. Revisa el internet e intenta de nuevo.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  const blocked = spots.filter((s) => s.blocked).length;
  const free = Math.max(spots.length - blocked - reservedToday, 0);

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Libres para hoy" value={free} tone="good" />
        <Stat label="Reservadas hoy" value={reservedToday} />
        <Stat
          label="Bloqueadas"
          value={blocked}
          tone={blocked ? "bad" : undefined}
        />
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

      <ul className="grid gap-3 sm:grid-cols-2">
        {spots.map((spot) => (
          <li
            key={spot.id}
            className={`flex items-center gap-4 rounded-2xl border p-4 ${
              spot.blocked
                ? "border-[#e08a8a]/35 bg-[#e08a8a]/[0.06]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-display text-cream text-lg">{spot.label}</p>
              <p className="text-cream-muted text-xs">
                {spot.blocked ? "Bloqueada" : "Disponible"}
                {spot.blocked && spot.blockedReason
                  ? ` · ${spot.blockedReason}`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              disabled={busyId === spot.id}
              onClick={() => {
                if (spot.blocked) {
                  void setBlocked(spot, false, null);
                } else {
                  setReason("");
                  setBlocking(spot);
                }
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
                spot.blocked
                  ? "bg-[#8fd6ab] text-[#0b0d10]"
                  : "border-brass/40 text-brass-light border"
              }`}
            >
              {busyId === spot.id
                ? "…"
                : spot.blocked
                  ? "Desbloquear"
                  : "Bloquear"}
            </button>
          </li>
        ))}
      </ul>

      {blocking && (
        <AdminDialog
          title={`Bloquear ${blocking.label}`}
          onClose={() => setBlocking(null)}
          busy={busyId === blocking.id}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await setBlocked(blocking, true, reason || null);
              if (ok) setBlocking(null);
            }}
            className="grid gap-4"
          >
            <p className="text-cream-muted text-sm">
              Nadie podrá reservarla, en ninguna fecha, hasta que la
              desbloquees.
            </p>
            <div>
              <label htmlFor="spot-reason" className={adminLabelClass}>
                Motivo (opcional)
              </label>
              <input
                id="spot-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={120}
                autoFocus
                placeholder="Ej: ocupada sin reserva"
                className={adminInputClass}
              />
            </div>
            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlocking(null)}
                className="text-cream-muted hover:text-cream px-4 py-2.5 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busyId === blocking.id}
                className="from-brass-light to-brass text-obsidian rounded-full bg-gradient-to-br px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {busyId === blocking.id ? "Bloqueando…" : "Bloquear"}
              </button>
            </div>
          </form>
        </AdminDialog>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "good" | "bad";
}) {
  const color =
    tone === "good"
      ? "text-[#8fd6ab]"
      : tone === "bad"
        ? "text-[#e08a8a]"
        : "text-cream";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className={`font-display text-2xl ${color}`}>{value}</p>
      <p className="text-cream-muted text-xs">{label}</p>
    </div>
  );
}
