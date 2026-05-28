import InteractiveHero from "@/components/ui/hero-section-nexus";
import { SocialProof } from "@/components/landing/social-proof";
import { BentoGrid } from "@/components/landing/bento-grid";
import { Pricing } from "@/components/landing/pricing";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000000]">
      {/* S1+S2 — Navbar + Hero */}
      <InteractiveHero />

      {/* S3 — Social proof marquee */}
      <SocialProof />

      {/* S4 — Bento grid */}
      <BentoGrid />

      {/* S8 — Pricing */}
      <Pricing />

      {/* S10 — Final CTA banner (always dark) */}
      <CtaBanner />

      {/* S11 — FAQ */}
      <Faq />

      {/* S13 — Footer */}
      <Footer />
    </div>
  );
}
