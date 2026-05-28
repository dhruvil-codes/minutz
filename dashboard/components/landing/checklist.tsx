"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const features = [
  "Invisible recording", "Chrome Extension", "AI transcription", "Action items",
  "Key decisions", "Follow-up tasks", "Niche modes", "Slack sync",
  "Notion sync", "HubSpot sync", "Linear sync", "Team analytics",
  "Admin controls", "Priority processing", "Full history", "Daily digest",
];

export function Checklist() {
  return (
    <section className="border-t border-[#E5E5E5] bg-[#F5F5F5] py-20 dark:border-[#2A2A2A] dark:bg-[#111111]">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-[#000000] dark:text-white">
            Everything your meeting workflow needs, included.
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: 0.1, ease }}
          className="mt-10 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 md:grid-cols-4"
        >
          {features.map((f) => (
            <div key={f} className="flex items-center gap-2.5">
              <Check className="h-4 w-4 shrink-0 text-[#FF6A00]" />
              <span className="text-sm text-[#000000] dark:text-white">{f}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
