"use client";

import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const faqs = [
  {
    q: "Does anyone know I'm recording?",
    a: "No. Minutz captures audio directly from your browser tab. No bot joins the call, and no notification is sent to other participants.",
  },
  {
    q: "What meeting platforms does it support?",
    a: "Google Meet, Zoom, and Microsoft Teams. Any meeting running in a Chrome browser tab works with Minutz.",
  },
  {
    q: "How long does processing take?",
    a: "Under 60 seconds for most meetings. Longer recordings may take 2-3 minutes depending on length and complexity.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Transcripts and summaries are stored securely and encrypted. We never train on your meeting data.",
  },
  {
    q: "What is the difference between niche modes?",
    a: "Sales mode extracts objections and deal signals. PM mode captures feature requests and decisions. Financial mode flags compliance risks. General mode works for everything else.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no lock-in. Cancel from your dashboard in one click and your data is retained for 30 days.",
  },
  {
    q: "How much does it cost?",
    a: "The free plan includes 5 meetings per month. Pro is $19/month for unlimited meetings and all integrations. Team plans start at $12 per seat.",
  },
];

export function Faq() {
  return (
    <section className="bg-black py-28">
      <div className="mx-auto max-w-2xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-[#000000] dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-[#6B6B6B] dark:text-[#A3A3A3]">
            Common questions about how Minutz works. Reach out at{" "}
            <a href="mailto:hello@minutz.ai" className="text-[#FF6A00] hover:underline">
              hello@minutz.ai
            </a>{" "}
            if you don&apos;t find your answer.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.1, ease }}
          className="mt-12"
        >
          <Accordion multiple={false} className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`q${i}`}
                className="border-b border-[#E5E5E5] dark:border-[#2A2A2A]"
              >
                <AccordionTrigger className="py-5 text-left text-sm font-semibold text-[#000000] hover:no-underline dark:text-white">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-[#6B6B6B] dark:text-[#A3A3A3]">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
