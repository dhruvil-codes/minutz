"use client";

import { cn } from "@/lib/utils";
import React from "react";

type InfiniteSliderProps = {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  gap?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
};

export function InfiniteSlider({
  children,
  className,
  duration = 40,
  gap = 16,
  reverse = false,
  pauseOnHover = false,
}: InfiniteSliderProps) {
  return (
    <div
      className={cn("group flex overflow-hidden", className)}
      style={
        {
          "--duration": `${duration}s`,
          "--gap": `${gap}px`,
        } as React.CSSProperties
      }
    >
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex shrink-0 items-center gap-[var(--gap)] animate-marquee",
            reverse && "[animation-direction:reverse]",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
          aria-hidden={index > 0}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
