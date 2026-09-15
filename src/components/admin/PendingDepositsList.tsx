"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatTime } from "@/lib/reservation";
import { formatCOP } from "@/lib/currency";

export type PendingDeposit = {
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  partySize: number;
  date: string;
  time: string;
  occasion: string | null;
  notes: string | null;
  depositRequired: number;
  depositAmount: number;
  depositReference: string | null;
};

type RowState = "idle" | "working" | "done" | "error";

export default function PendingDepositsList({
  deposits,
}: {
  deposits: PendingDeposit[];
}) {
  const router = useRouter();
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [rowMessages, setRowMessages] = useState<Record<string, string>>({});

  async function act(code: string, action: "approve" | "reject") {
    setRowStates((prev) => ({ ...prev, [code]: "working" }));
    try {
      const res = await fetch(
        `/api/admin/deposits/${encodeURIComponent(code)}/${action}`,
        { method: "POST" },
      );
      const body = (await res.json().catch(() => null)) as {
        status?: string;
      } | null;

      if (
        res.ok &&
        (body?.status === "confirmed" || body?.status === "rejected")
      ) {
        setRowStates((prev) => ({ ...prev, [code]: "done" }));
        router.refresh();
        return;
      }
      if (body?.status === "full") {
        setRowMessages((prev) => ({
          ...prev,
          [code]:
            "Ese horario ya se llenó — contacta al cliente para reprogramar.",
        }));
      }
      setRowStates((prev) => ({ ...prev, [code]: "error" }));
    } catch {
      setRowStates((prev) => ({ ...prev, [code]: "error" }));
    }
  }

  if (deposits.length === 0) {
    return (
      <p className="text-cream-muted text-center text-sm">
        No hay depósitos pendientes por revisar.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {deposits.map((d) => {
        const state = rowStates[d.code] ?? "idle";
        const short = d.depositAmount < d.depositRequired;

        return (
          <div
            key={d.code}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-cream text-lg tracking-wide">
                  {d.code}
                </p>
                <p className="text-cream-muted text-sm">{d.name}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-cream font-semibold">
                  {formatDate(d.date, "es")}
                </p>
                <p className="text-cream-muted">{formatTime(d.time)}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-cream-muted">Personas: </span>
                <span className="text-cream">{d.partySize}</span>
              </div>
              {d.email && (
                <div>
                  <span className="text-cream-muted">Correo: </span>
                  <span className="text-cream">{d.email}</span>
                </div>
              )}
              {d.phone && (
                <div>
                  <span className="text-cream-muted">Teléfono: </span>
                  <span className="text-cream">{d.phone}</span>
                </div>
              )}
              {d.occasion && (
                <div>
                  <span className="text-cream-muted">Ocasión: </span>
                  <span className="text-cream">{d.occasion}</span>
                </div>
              )}
            </div>

            <div
              className={`mt-3 rounded-xl border p-3 text-sm ${
                short
                  ? "border-[#e08a8a]/35 bg-[#e08a8a]/[0.08]"
                  : "border-[#8fd6ab]/35 bg-[#8fd6ab]/[0.08]"
              }`}
            >
              <p className="font-semibold">
                {formatCOP(d.depositAmount)}{" "}
                <span className="text-cream-muted font-normal">
                  / {formatCOP(d.depositRequired)} requeridos
                </span>
              </p>
              <p className="text-cream-muted mt-1">
                Referencia: {d.depositReference ?? "no dio ninguna"}
              </p>
              {short && (
                <p className="mt-1 text-[#e08a8a]">
                  ⚠ El monto reportado es menor al requerido.
                </p>
              )}
              {d.depositReference && (
                // eslint-disable-next-line @next/next/no-img-element -- served from our own protected API route, not a static asset
                <img
                  src={`/api/deposit-receipts/${encodeURIComponent(d.depositReference)}`}
                  alt="Comprobante de transferencia"
                  className="mt-3 max-h-64 w-full rounded-lg border border-white/10 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              )}
            </div>

            {rowMessages[d.code] && (
              <p className="mt-2 text-sm text-[#e08a8a]">
                {rowMessages[d.code]}
              </p>
            )}

            {state !== "done" && (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => act(d.code, "approve")}
                  disabled={state === "working"}
                  className="flex-1 rounded-full bg-[#8fd6ab] py-2.5 text-sm font-semibold text-[#0b0d10] disabled:opacity-50"
                >
                  {state === "working" ? "…" : "Aprobar"}
                </button>
                <button
                  type="button"
                  onClick={() => act(d.code, "reject")}
                  disabled={state === "working"}
                  className="flex-1 rounded-full border border-[#e08a8a]/50 py-2.5 text-sm font-semibold text-[#e08a8a] disabled:opacity-50"
                >
                  {state === "working" ? "…" : "Rechazar"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
