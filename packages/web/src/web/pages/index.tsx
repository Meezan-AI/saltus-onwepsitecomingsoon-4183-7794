import { Nav } from "../components/nav";
import { Hero } from "../components/hero";
import { DigitalSolutions } from "../components/digital-solutions";
import { BrandingPrinting } from "../components/branding-printing";
import { WhyUs } from "../components/why-us";
import { Process } from "../components/process";
import { Showcase } from "../components/showcase";
import { LaunchingSoon } from "../components/launching-soon";
import { Cta } from "../components/cta";
import { Footer } from "../components/footer";

export default function Index() {
  return (
    <div className="min-h-screen bg-[#0b1f3a]">
      <Nav />
      <Hero />
      <DigitalSolutions />
      <BrandingPrinting />
      <WhyUs />
      <Process />
      <Showcase />
      <LaunchingSoon />
      <Cta />
      <Footer />
    </div>
  );
}
