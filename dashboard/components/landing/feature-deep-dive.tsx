"use client";

import { motion } from "motion/react";
import { NumberTicker } from "@/components/magicui/number-ticker";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const features = [
  {
    tag: "Recording",
    title: "Invisible. No bot. No notification.",
    body: "Minutz captures audio directly from your browser tab using the Chrome Extension. Nobody on the call knows it's running. No awkward bot joining. No permission requests.",
    imageLeft: true,
    mockup: null,
  },
  {
    tag: "AI Analysis",
    title: "Auto-generated action items",
    body: "Turn meeting audio into a prioritized action list automatically. No more guessing who owns what or re-reading a 40-minute transcript to find the three things that actually matter.",
    imageLeft: false,
    mockup: "actions",
  },
  {
    tag: "Always Current",
    title: "Priorities update in real time",
    body: "Summaries update as new meetings come in, so your action items reflect what was actually said today. Not last week. Not what you thought you remembered.",
    imageLeft: true,
    mockup: null,
  },
  {
    tag: "Niche Intelligence",
    title: "Built for your workflow",
    body: "Sales mode extracts deal signals and objections. PM mode captures feature requests and decisions. Financial mode flags compliance risks. One tool, four modes.",
    imageLeft: false,
    mockup: null,
  },
];

const mockActions = [
  { label: "Follow up with Acme on pricing", count: 4 },
  { label: "Schedule technical demo", count: 2 },
  { label: "Send contract to legal", count: 1 },
];

function FeatureMockup({ mockup }: { mockup: string | null }) {
  if (mockup === "actions") {
    return (
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 dark:border-[#2A2A2A] dark:bg-[#1A1A1A]">
        <p className="mb-4 text-sm font-semibold text-[#000000] dark:text-white">Action Items</p>
        <div className="space-y-3.5">
          {mockActions.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-[#6B6B6B] dark:text-[#A3A3A3]">{item.label}</span>
              <span className="shrink-0 rounded-md bg-[#FFF3E8] px-2.5 py-0.5 text-xs font-bold text-[#FF6A00] dark:bg-[#2A1800]">
                <NumberTicker value={item.count} className="text-[#FF6A00]" />
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] dark:border-[#2A2A2A] dark:bg-[#1A1A1A]">
      <span className="text-sm text-[#A3A3A3]">Feature Preview</span>
    </div>
  );
}

export function FeatureDeepDive() {
  return (
    <section className="py-4">
      {features.map((feature, i) => (
        <div key={feature.tag} className="border-t border-[#E5E5E5] py-24 dark:border-[#2A2A2A]">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, ease }}
              className={`flex flex-col gap-14 md:flex-row md:items-center ${feature.imageLeft ? "" : "md:flex-row-reverse"}`}
            >
              <div className="flex-1">
                <FeatureMockup mockup={feature.mockup} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#FF6A00]">
                  {feature.tag}
                </p>
                <h3 className="mt-3 text-3xl font-bold tracking-tight text-[#000000] dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-[#6B6B6B] dark:text-[#A3A3A3]">
                  {feature.body}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      ))}
    </section>
  );
}
