"use client";

import { motion } from "motion/react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Particles } from "@/components/magicui/particles";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-[#000000] py-28">
      <Particles className="absolute inset-0" quantity={50} color="#FF6A00" size={0.6} staticity={50} />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease }}
          className="text-5xl font-bold tracking-tight text-white"
        >
          Stop guessing. Start shipping.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          className="mt-5 text-lg text-[#A3A3A3]"
        >
          Start for free. No credit card required.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, delay: 0.16, ease }}
          className="mt-8 flex justify-center"
        >
          <ShimmerButton
            background="linear-gradient(90deg, #FF6A00, #FFB347)"
            className="h-12 px-8 text-sm font-semibold"
            onClick={() => { window.location.href = "/login"; }}
          >
            Get Started Free
          </ShimmerButton>
        </motion.div>
      </div>
    </section>
  );
}
