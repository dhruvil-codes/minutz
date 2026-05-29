"use client";

import { motion } from "motion/react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Particles } from "@/components/magicui/particles";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const extensionRepoUrl = "https://github.com/dhruvil-codes/minutz";

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-background py-28">
      <Particles className="absolute inset-0" quantity={50} color="#FF6A00" size={0.6} staticity={50} />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease }}
          className="text-5xl font-bold tracking-tight text-[var(--color-text-primary)]"
        >
          Stop guessing. Start shipping.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          className="mt-5 text-lg text-[var(--color-text-secondary)]"
        >
          Start for free. No credit card required.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, delay: 0.16, ease }}
          className="mt-8 flex flex-col items-center justify-center gap-3"
        >
          <ShimmerButton
            href={extensionRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            background="linear-gradient(90deg, #FF6A00, #FFB347)"
            className="h-12 px-8 text-sm font-semibold"
          >
            Install Chrome Extension
          </ShimmerButton>
          <p className="max-w-md text-center text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Currently in beta — install manually from GitHub. Chrome Web Store listing coming soon.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
