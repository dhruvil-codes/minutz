"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Hero() {
  return (
    <section className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6 pt-16 dark:bg-[#000000]">
      <div className="mx-auto w-full max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <span className="inline-block rounded-full border border-[#E5E5E5] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] dark:border-[#2A2A2A] dark:text-[#A3A3A3]">
            AI Meeting Intelligence
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          className="mt-6 text-5xl font-bold leading-[1.08] tracking-tight text-[#000000] dark:text-white md:text-6xl lg:text-7xl"
        >
          Your meetings,{" "}
          <span className="bg-gradient-to-r from-[#FF6A00] to-[#FFB347] bg-clip-text text-transparent">
            finally useful.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease }}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#6B6B6B] dark:text-[#A3A3A3]"
        >
          Record invisibly. Get summaries, action items, and decisions in 60 seconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24, ease }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <ShimmerButton
            background="#FF6A00"
            className="h-11 px-7 text-sm font-semibold"
            onClick={() => { window.location.href = "/signup"; }}
          >
            Get Started Free
          </ShimmerButton>
          <Link
            href="#demo"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#E5E5E5] px-7 text-sm font-semibold text-[#000000] transition-colors hover:border-[#000000] dark:border-[#2A2A2A] dark:text-white dark:hover:border-white"
          >
            Watch Demo
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.36, ease }}
          className="mt-16 overflow-hidden rounded-2xl border border-[#E5E5E5] bg-[#F5F5F5] shadow-[0_0_60px_rgba(255,106,0,0.08)] dark:border-[#2A2A2A] dark:bg-[#1A1A1A]"
        >
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="/dashboard.png"
              alt="Minutz dashboard preview"
              fill
              priority
              className="object-cover object-top"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
