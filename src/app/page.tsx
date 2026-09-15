import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import MenuTeaser from "@/components/sections/MenuTeaser";
import WhySection from "@/components/sections/WhySection";
import EventsSection from "@/components/sections/EventsSection";
import Testimonials from "@/components/sections/Testimonials";
import Gallery from "@/components/sections/Gallery";
import Location from "@/components/sections/Location";
import ReservationWizard from "@/components/ReservationWizard";
import SkipLink from "@/components/SkipLink";
import { getPublicMenu } from "@/db/menuStore";
import { teaserItems } from "@/lib/menu";

// See src/app/carta/page.tsx — same revalidation for the menu teaser.
export const revalidate = 3600;

export default async function Home() {
  const houseCocktails = teaserItems(await getPublicMenu());

  return (
    <>
      <SkipLink />
      <Header />

      <main id="main-content" className="flex-1">
        <Hero />
        <About />
        <MenuTeaser items={houseCocktails} />
        <WhySection />
        <EventsSection />
        <Testimonials />
        <Gallery />
        <Location />
        <ReservationWizard />
      </main>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
