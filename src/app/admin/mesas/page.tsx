import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminRole } from "@/lib/adminAuth";
import { getSpots } from "@/db/spotsStore";
import { getAvailability } from "@/db/reservationsStore";
import { todayISO } from "@/lib/reservation";
import AdminNav from "@/components/admin/AdminNav";
import SpotsPanel from "@/components/admin/SpotsPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mesas",
  robots: { index: false, follow: false },
};

export default async function AdminSpotsPage() {
  // Blocking tables is floor work — employees and owners both get here.
  const role = await getAdminRole();
  if (!role) redirect("/admin");

  let spots = null;
  let reservedToday = 0;
  try {
    spots = await getSpots();
    const today = await getAvailability(todayISO());
    reservedToday = today[0]?.booked ?? 0;
  } catch (err) {
    console.error("GET /admin/mesas: couldn't load the tables:", err);
  }

  return (
    <main className="bg-obsidian min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <AdminNav role={role} />
        <h1 className="font-display text-cream mb-2 text-2xl">Mesas</h1>
        <p className="text-cream-muted mb-8 text-sm">
          Bloquea una mesa o un puesto de barra cuando alguien se sienta sin
          reservar. Mientras esté bloqueada nadie puede reservarla en la web, y
          vuelve a estar disponible apenas la desbloquees.
        </p>
        {spots ? (
          <SpotsPanel spots={spots} reservedToday={reservedToday} />
        ) : (
          <div
            role="alert"
            className="rounded-xl border border-[#e08a8a]/35 bg-[#e08a8a]/[0.08] p-5 text-sm text-[#e08a8a]"
          >
            <p className="font-semibold">No se pudieron cargar las mesas.</p>
            <p className="mt-2">
              Si es la primera vez, falta crear la tabla en la base de datos:
              ejecuta <code className="text-cream">npm run db:setup</code> y
              recarga la página.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
