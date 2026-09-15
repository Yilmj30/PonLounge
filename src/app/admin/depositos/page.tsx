import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getPendingDeposits } from "@/db/reservationsStore";
import PendingDepositsList from "@/components/admin/PendingDepositsList";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Depósitos pendientes",
  robots: { index: false, follow: false },
};

export default async function AdminDepositsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  const deposits = await getPendingDeposits();

  return (
    <main className="bg-obsidian min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <AdminNav />
        <h1 className="font-display text-cream mb-2 text-2xl">
          Depósitos pendientes
        </h1>
        <p className="text-cream-muted mb-8 text-sm">
          Verifica cada transferencia contra el extracto bancario antes de
          aprobar. Al aprobar, se revisa el cupo de nuevo (puede haberse llenado
          mientras tanto) y se le manda al cliente el correo de confirmación con
          su código.
        </p>
        <PendingDepositsList
          deposits={deposits.map((d) => ({
            code: d.code,
            name: d.name,
            email: d.email,
            phone: d.phone,
            partySize: d.partySize,
            date: d.date,
            time: d.time,
            occasion: d.occasion,
            notes: d.notes,
            depositRequired: d.depositRequired,
            depositAmount: d.depositAmount,
            depositReference: d.depositReference,
          }))}
        />
      </div>
    </main>
  );
}
