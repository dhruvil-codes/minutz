"use client";

import Link from "next/link";
import { motion } from "motion/react";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const cards = [
  {
    title: "Works with your existing tools",
    body: "Connect Slack, Notion, HubSpot, or Linear. No migration required.",
    cta: "View integrations",
    href: "#integrations",
  },
  {
    title: "Ready in 60 seconds",
    body: "Install the Chrome Extension. Minutz starts turning meetings into actions immediately.",
    cta: "View docs",
    href: "#",
  },
  {
    title: "Built for fast-moving teams",
    body: "Not a note-taking tool. A prioritized inbox of what was decided and what to do next.",
    cta: "Watch demo",
    href: "#demo",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="bg-[#F5F5F5] py-20 dark:bg-[#111111]">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white p-7 dark:border-[#2A2A2A] dark:bg-[#1A1A1A]"
            >
              <h3 className="text-base font-semibold text-[#000000] dark:text-white">{card.title}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-[#6B6B6B] dark:text-[#A3A3A3]">{card.body}</p>
              <Link href={card.href} className="mt-5 text-sm font-semibold text-[#FF6A00] hover:text-[#E55E00]">
                {card.cta} &rarr;
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
