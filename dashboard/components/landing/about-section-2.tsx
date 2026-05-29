"use client";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { Zap } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

export function AboutSection2() {
  const heroRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (index: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: index * 0.28,
        duration: 0.7,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: 40,
      opacity: 0,
    },
  };

  const textVariants = {
    visible: (index: number) => ({
      filter: "blur(0px)",
      opacity: 1,
      transition: {
        delay: index * 0.18,
        duration: 0.7,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      opacity: 0,
    },
  };

  return (
    <section id="about" className="bg-background px-6 pb-12 pt-24 md:pb-8 md:pt-28">
      <div className="mx-auto max-w-3xl lg:max-w-5xl" ref={heroRef}>
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <div className="w-full flex-1">
            <TimelineContent
              as="h2"
              animationNum={0}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className="text-3xl font-semibold !leading-[110%] tracking-tight text-[var(--color-text-primary)] sm:text-4xl md:text-5xl lg:text-6xl"
            >
              We are{" "}
              <TimelineContent
                as="span"
                animationNum={1}
                timelineRef={heroRef}
                customVariants={textVariants}
                className="inline-block rounded-md border-2 border-dotted border-[#FF6A00] px-2 text-[#FF6A00]"
              >
                rethinking
              </TimelineContent>{" "}
              meeting notes so they stop feeling like homework. Minutz captures calls{" "}
              <TimelineContent
                as="span"
                animationNum={2}
                timelineRef={heroRef}
                customVariants={textVariants}
                className="inline-block rounded-md border-2 border-dotted border-[var(--color-border)] px-2 text-[var(--color-text-primary)]"
              >
                invisibly
              </TimelineContent>{" "}
              and turns conversations into decisions your team can{" "}
              <TimelineContent
                as="span"
                animationNum={3}
                timelineRef={heroRef}
                customVariants={textVariants}
                className="inline-block rounded-md border-2 border-dotted border-[#FF6A00]/70 px-2 text-[#FF6A00]"
              >
                act on.
              </TimelineContent>
            </TimelineContent>

            <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <TimelineContent
                as="div"
                animationNum={4}
                timelineRef={heroRef}
                customVariants={textVariants}
                className="max-w-xl"
              >
                <div className="mb-1 text-sm font-medium uppercase tracking-[0.14em] text-[#FF6A00]">
                  Why Minutz exists
                </div>
                <div className="text-base font-medium leading-relaxed text-[var(--color-text-secondary)] sm:text-xl">
                  No bots in the room. No context lost. Just summaries, action items, and follow-ups synced where work already happens.
                </div>
              </TimelineContent>

              <TimelineContent
                as={Link}
                href="#features"
                animationNum={5}
                timelineRef={heroRef}
                customVariants={textVariants}
                className="inline-flex h-12 w-fit cursor-pointer items-center gap-2 rounded-full bg-[#FF6A00] px-5 text-sm font-semibold text-white shadow-[0_0_32px_rgba(255,106,0,0.28)] transition-colors hover:bg-[#E55E00]"
              >
                <Zap fill="white" size={16} />
                See how it works
              </TimelineContent>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
