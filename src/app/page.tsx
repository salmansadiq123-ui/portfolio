import Preloader from "@/components/Preloader";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Manifesto from "@/components/Manifesto";
import Featured from "@/components/Featured";
import Catalog from "@/components/Catalog";
import Services from "@/components/Services";
import QA from "@/components/QA";
import QaLabFeature from "@/components/QaLabFeature";
import Experience from "@/components/Experience";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main>
      <Preloader />
      <Hero />
      <Marquee />
      <Manifesto />
      <Featured />
      <Catalog />
      <Services />
      <QA />
      <QaLabFeature />
      <Experience />
      <Contact />
    </main>
  );
}
