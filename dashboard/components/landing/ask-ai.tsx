"use client";

import { motion } from "motion/react";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const aiLinks = [
  { label: "ChatGPT", href: "https://chatgpt.com/?q=Tell me more about Minutz (the AI meeting tool)" },
  { label: "Perplexity", href: "https://www.perplexity.ai/search?q=Tell me more about Minutz" },
  { label: "Gemini", href: "https://gemini.google.com/app?q=Tell me more about Minutz" },
  { label: "Claude", href: "https://claude.ai/new?q=Tell me more about Minutz" },
];

export function AskAi() {
  return (
    <section className="border-t border-[#E5E5E5] py-20 text-center dark:border-[#2A2A2A]">
      <div className="mx-auto max-w-xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease }}
        >
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-white">
            Ask AI about Minutz
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {aiLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#E5E5E5] px-5 py-2 text-sm font-medium text-[#6B6B6B] transition-colors hover:border-[#FF6A00] hover:text-[#FF6A00] dark:border-[#2A2A2A] dark:text-[#A3A3A3] dark:hover:border-[#FF6A00] dark:hover:text-[#FF6A00]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
