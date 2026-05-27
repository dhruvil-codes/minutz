"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "motion/react";

const Hero = () => {
  return (
    <motion.div
      className="flex flex-col gap-16 items-center justify-center py-2 lg:pt-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <section className="flex flex-col lg:flex-row items-center justify-between w-full max-xl:gap-6 max-w-7xl lg:max-w-6xl">
        <div className="flex flex-col gap-4 lg:max-w-lg xl:max-w-2xl items-center lg:items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
            ⚡ AI-powered meeting intelligence
          </span>
          <p className="max-md:font-medium text-3xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tighter text-center lg:text-left">
            Your meetings, finally useful.
          </p>
        </div>
        <section className="flex flex-col gap-8">
          <p className="text-md md:text-xl max-w-xl lg:max-w-md text-center lg:text-left">
            Record invisibly. Get executive summaries, action items, and decisions in 60 seconds. Auto-synced to Slack, Notion, and HubSpot.
          </p>
          <div className="flex flex-row gap-2">
            <Button className="rounded-full max-lg:hidden">Start for free</Button>
            <Button className="rounded-full max-lg:w-full" variant="outline">Watch Demo</Button>
          </div>
        </section>
      </section>
      <div className="relative">
        <Image
          src="/images/templates/axis/hero.svg"
          alt="Hero"
          width={1200}
          height={800}
          className="w-full max-w-7xl h-auto rounded-xl lg:rounded-[2.5rem]"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
        />
        <div className="max-md:hidden absolute bottom-0 left-0 h-12 lg:h-24 w-full dark:bg-gradient-to-b from-transparent to-background" />
      </div>
    </motion.div>
  );
};

export default Hero;
