"use client";

import { useEffect, useState } from "react";
import InteractiveHero from "@/components/ui/hero-section-nexus";
import { SocialProof } from "@/components/landing/social-proof";
import { AboutSection2 } from "@/components/landing/about-section-2";
import { BentoGrid } from "@/components/landing/bento-grid";
import Testimonials from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* S1+S2 - Navbar + Hero */}
      <InteractiveHero />

      {/* S3 - Social proof marquee */}
      <SocialProof />

      {/* S4 - Bento grid */}
      <AboutSection2 />

      <BentoGrid />

      <Testimonials />

      {/* S8 - Pricing */}
      <Pricing />

      {/* S10 - Final CTA banner (always dark) */}
      <CtaBanner />

      {/* S11 - FAQ */}
      <Faq />

      {/* S13 - Footer */}
      <Footer />
    </div>
  );
}
