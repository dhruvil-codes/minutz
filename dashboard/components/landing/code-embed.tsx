"use client";

import { motion } from "motion/react";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const points = [
  { title: "One-click install", body: "Install from the Chrome Web Store in seconds. No configuration, no API keys, no setup wizard." },
  { title: "Zero friction recording", body: "Click record. Minutz captures your tab audio silently. Stop when done and get your summary in under 60 seconds." },
  { title: "Fits your existing workflow", body: "Connects to Slack, Notion, HubSpot, and Linear automatically. Your tools stay the same." },
];

export function CodeEmbed() {
  return (
    <section className="bg-[#F5F5F5] py-28 dark:bg-[#111111]">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-[#000000] dark:text-white">
            A Chrome Extension that fits anywhere.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-[#6B6B6B] dark:text-[#A3A3A3]">
            No bots. No interruptions. Just clarity in 60 seconds.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-10 md:grid-cols-2 md:items-start">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease }}
            className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#000000]"
          >
            <div className="flex items-center gap-1.5 border-b border-[#2A2A2A] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            </div>
            <div className="border-l-2 border-[#FF6A00] p-6 font-mono text-sm leading-7">
              <p className="text-[#6B6B6B]">chrome.extension.install{"({"}</p>
              <p className="ml-4 text-[#A3A3A3]">
                key: <span className="text-[#FF6A00]">&quot;pk_live_...&quot;</span>,
              </p>
              <p className="ml-4 text-[#A3A3A3]">
                capture: <span className="text-[#FF6A00]">&quot;tab-audio&quot;</span>,
              </p>
              <p className="ml-4 text-[#A3A3A3]">
                mode: <span className="text-[#FF6A00]">&quot;sales&quot;</span>
              </p>
              <p className="text-[#6B6B6B]">{"})"};</p>
            </div>
          </motion.div>

          <div className="space-y-8">
            {points.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
              >
                <h3 className="text-base font-semibold text-[#000000] dark:text-white">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#6B6B6B] dark:text-[#A3A3A3]">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
