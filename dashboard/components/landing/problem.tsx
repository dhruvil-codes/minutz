"use client";

import { motion } from "motion/react";
import { NumberTicker } from "@/components/magicui/number-ticker";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const feedItems = [
  { initial: "R", name: "Rachel M.", role: "Sales Lead", text: "Sales call with Acme Corp", items: 3 },
  { initial: "P", name: "Priya S.", role: "Product Manager", text: "Sprint planning session", items: 8 },
  { initial: "V", name: "Victor L.", role: "Finance Director", text: "Client review meeting", items: 5 },
];

const actionItems = [
  { label: "Follow up with Acme on pricing", count: 4 },
  { label: "Schedule technical demo", count: 2 },
  { label: "Send contract to legal", count: 1 },
];

export function Problem() {
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
          <h2 className="text-4xl font-bold tracking-tight text-[#000000] dark:text-white md:text-5xl">
            Stop losing your meeting intelligence.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#6B6B6B] dark:text-[#A3A3A3]">
            Most tools give you a transcript. Minutz gives you a ranked list of what happened, what was decided, and what to do next.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {feedItems.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              className="rounded-xl border border-[#E5E5E5] bg-white p-5 dark:border-[#2A2A2A] dark:bg-[#1A1A1A]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6A00]/10 text-sm font-bold text-[#FF6A00]">
                  {item.initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#000000] dark:text-white">{item.name}</p>
                  <p className="text-xs text-[#A3A3A3]">{item.role}</p>
                  <p className="mt-2 text-sm text-[#6B6B6B] dark:text-[#A3A3A3]">{item.text}</p>
                  <p className="mt-1.5 text-xs font-semibold text-[#FF6A00]">{item.items} action items extracted</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: 0.2, ease }}
          className="mx-auto mt-8 max-w-lg rounded-xl border border-[#E5E5E5] bg-white p-6 dark:border-[#2A2A2A] dark:bg-[#1A1A1A]"
        >
          <p className="mb-5 text-sm font-semibold text-[#000000] dark:text-white">Action Items</p>
          <div className="space-y-4">
            {actionItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#6B6B6B] dark:text-[#A3A3A3]">{item.label}</span>
                <span className="flex shrink-0 items-center rounded-md bg-[#FFF3E8] px-2.5 py-0.5 text-xs font-bold text-[#FF6A00] dark:bg-[#2A1800]">
                  <NumberTicker value={item.count} className="text-[#FF6A00]" />
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
