"use client";

import { Play } from "lucide-react";
import { motion } from "motion/react";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function DemoVideo() {
  return (
    <section id="demo" className="bg-[#F5F5F5] py-28 dark:bg-[#111111]">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-[#000000] dark:text-white">
            Watch a meeting become intelligence in 60 seconds.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-[#6B6B6B] dark:text-[#A3A3A3]">
            See how Minutz captures, transcribes, and summarizes a real meeting from start to finish.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="mt-12 overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#000000]"
        >
          <div className="flex h-[420px] items-center justify-center">
            <button
              className="group flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6A00] shadow-[0_0_40px_rgba(255,106,0,0.35)] transition-transform duration-200 hover:scale-105 active:scale-95"
              aria-label="Play demo video"
            >
              <Play className="ml-1 h-6 w-6 fill-white text-white" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
