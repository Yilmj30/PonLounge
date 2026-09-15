import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getAdminMenu } from "@/db/menuStore";
import AdminNav from "@/components/admin/AdminNav";
import MenuEditor from "@/components/admin/MenuEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar carta",
  robots: { index: false, follow: false },
};

export default async function AdminMenuPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  let categories: Awaited<ReturnType<typeof getAdminMenu>> | null = null;
  try {
    categories = await getAdminMenu();
  } catch (err) {
    // Most likely the menu migration hasn't been applied to this database.
    console.error("GET /admin/carta: couldn't load the menu:", err);
  }

  return (
    <main className="bg-obsidian min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <AdminNav />
        <h1 className="font-display text-cream mb-2 text-2xl">Carta</h1>
        <p className="text-cream-muted mb-8 text-sm">
          Cambia precios, fotos y descripciones, agrega productos nuevos u
          oculta los que no estén disponibles. Los cambios se ven en la carta
          pública apenas guardas.
        </p>
        {categories ? (
          <MenuEditor categories={categories} />
        ) : (
          <div
            role="alert"
            className="rounded-xl border border-[#e08a8a]/35 bg-[#e08a8a]/[0.08] p-5 text-sm text-[#e08a8a]"
          >
            <p className="font-semibold">No se pudo cargar la carta.</p>
            <p className="mt-2">
              Si es la primera vez que se abre este panel, falta crear las
              tablas de la carta en la base de datos: ejecuta{" "}
              <code className="text-cream">npm run db:setup</code> y recarga la
              página. Si el problema sigue, revisa la conexión a la base de
              datos.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
