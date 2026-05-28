"use client";

import { motion } from "motion/react";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const categories = [
  {
    label: "Gather",
    items: [
      { name: "Zoom", initial: "Z", color: "#2D8CFF" },
      { name: "Google Meet", initial: "G", color: "#34A853" },
      { name: "Microsoft Teams", initial: "T", color: "#6264A7" },
    ],
  },
  {
    label: "Sync",
    items: [
      { name: "Slack", initial: "S", color: "#4A154B" },
      { name: "Notion", initial: "N", color: "#000000" },
      { name: "HubSpot", initial: "H", color: "#FF7A59" },
    ],
  },
  {
    label: "Push",
    items: [
      { name: "Linear", initial: "L", color: "#5E6AD2" },
      { name: "Jira", initial: "J", color: "#0052CC", soon: true },
      { name: "Salesforce", initial: "SF", color: "#00A1E0", soon: true },
    ],
  },
];

export function Integrations() {
  return (
    <section id="integrations" className="py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-[#000000] dark:text-white">
            Works with your existing stack
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-[#6B6B6B] dark:text-[#A3A3A3]">
            Connect the tools your team already uses. No migration required.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {categories.map((cat, ci) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: ci * 0.08, ease }}
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#A3A3A3]">{cat.label}</p>
              <div className="space-y-3">
                {cat.items.map((item) => (
                  <div key={item.name} className="flex items-center gap-3 rounded-xl border border-[#E5E5E5] bg-white p-4 dark:border-[#2A2A2A] dark:bg-[#1A1A1A]">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.initial}
                    </div>
                    <span className="flex-1 text-sm font-medium text-[#000000] dark:text-white">{item.name}</span>
                    {item.soon && (
                      <span className="rounded-full bg-[#F5F5F5] px-2 py-0.5 text-[10px] font-semibold text-[#6B6B6B] dark:bg-[#2A2A2A] dark:text-[#A3A3A3]">Soon</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
