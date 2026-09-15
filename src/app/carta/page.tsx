import type { Metadata } from "next";
import Header from "@/components/Header";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SkipLink from "@/components/SkipLink";
import CartaHero from "@/components/sections/CartaHero";
import MenuAccordion from "@/components/MenuAccordion";
import CartaNote from "@/components/CartaNote";
import CartaFooter from "@/components/CartaFooter";
import { getPublicMenu } from "@/db/menuStore";

export const metadata: Metadata = {
  title: "Carta",
  description:
    "Carta de PON Lounge: cócteles de la casa, clásicos de autor, gin tonics, cítricos, mocktails y más. Precios en pesos colombianos.",
  robots: {
    index: process.env.NEXT_PUBLIC_ENV === "production",
    follow: process.env.NEXT_PUBLIC_ENV === "production",
  },
};

// Rebuilt on demand when the owners edit the menu (see revalidateMenuPages);
// the hourly revalidation only catches edits made directly in the database.
export const revalidate = 3600;

export default async function CartaPage() {
  const categories = await getPublicMenu();

  return (
    <>
      <SkipLink />
      <Header cartaActive />

      <main id="main-content" className="flex-1">
        <CartaHero />

        <section className="bg-obsidian px-6 pb-24">
          <MenuAccordion categories={categories} />
          <p className="text-cream-muted mt-9 text-center text-sm">
            <CartaNote />
          </p>
        </section>
      </main>

      <CartaFooter />
      <WhatsAppFloat />
    </>
  );
}
