"use client";

import { motion } from "motion/react";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const benefits = [
  {
    title: "Turn noise into signal",
    body: "Stop reading through transcripts. Minutz groups decisions and actions automatically so you see outcomes, not a wall of text.",
  },
  {
    title: "Works with tools you already use",
    body: "Minutz connects to Slack, Notion, HubSpot, and Linear. Intelligence flows straight into your existing workflow.",
  },
  {
    title: "Wake up to your priorities",
    body: "Every morning, Minutz sends a digest of top action items and decisions from yesterday's meetings.",
  },
];

export function Benefits() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-[#000000] dark:text-white">
            Less noise. Better decisions. Faster follow-through.
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              className="rounded-xl border border-[#E5E5E5] bg-white p-7 dark:border-[#2A2A2A] dark:bg-[#1A1A1A]"
            >
              <div className="mb-4 h-8 w-8 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center">
                <div className="h-3 w-3 rounded-sm bg-[#FF6A00]" />
              </div>
              <h3 className="text-base font-semibold text-[#000000] dark:text-white">{b.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#6B6B6B] dark:text-[#A3A3A3]">{b.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
