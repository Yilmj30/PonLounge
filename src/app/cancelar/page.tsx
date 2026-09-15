import type { Metadata } from "next";
import Header from "@/components/Header";
import CartaFooter from "@/components/CartaFooter";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SkipLink from "@/components/SkipLink";
import CancelLookupForm from "@/components/CancelLookupForm";

export const metadata: Metadata = {
  title: "Cancelar reserva",
  robots: { index: false, follow: false },
};

export default function CancelLookupPage() {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden px-6 pt-40 pb-24">
          <CancelLookupForm />
        </section>
      </main>
      <CartaFooter />
      <WhatsAppFloat />
    </>
  );
}
