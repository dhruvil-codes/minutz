"use client";

import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

const tools = [
  {
    name: "Otter.ai",
    image: "/otter.png",
    fallback: "O",
  },
  {
    name: "Fireflies",
    image: null,
    fallback: "F",
  },
  {
    name: "Fathom",
    image: "/fathom.png",
    fallback: "F",
  },
  {
    name: "Zoom",
    image: "/zoom.png",
    fallback: "Z",
  },
  {
    name: "Google Meet",
    image: "/google-meet.png",
    fallback: "G",
  },
  {
    name: "Microsoft Teams",
    image: null,
    fallback: "T",
  },
];

export function SocialProof() {
  return (
    <section className="bg-background py-10">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
        For teams switching from
      </p>
      <div className="relative h-[72px] w-full overflow-hidden bg-background">
        <InfiniteSlider
          className="flex h-full w-full items-center"
          duration={30}
          gap={48}
          pauseOnHover
        >
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="flex w-44 items-center justify-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] opacity-60 transition-opacity duration-200 hover:opacity-100"
            >
              {tool.image ? (
                <img src={tool.image} alt="" className="h-7 w-7 rounded-full object-contain" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface)] text-[10px] font-bold text-[var(--color-text-primary)]">
                  {tool.fallback}
                </span>
              )}
              <span>{tool.name}</span>
            </div>
          ))}
        </InfiniteSlider>
        <ProgressiveBlur
          className="pointer-events-none absolute -top-px left-0 z-10 h-[calc(100%+2px)] w-[200px] overflow-hidden bg-background/5"
          direction="left"
          blurIntensity={1}
        />
        <ProgressiveBlur
          className="pointer-events-none absolute -top-px right-0 z-10 h-[calc(100%+2px)] w-[200px] overflow-hidden bg-background/5"
          direction="right"
          blurIntensity={1}
        />
      </div>
    </section>
  );
}
