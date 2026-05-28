"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#FF6A00",
  colorTo = "#FFB347",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        "[background:linear-gradient(white,white)_padding-box,conic-gradient(from_calc(var(--anchor)*1deg),var(--color-from)_0deg,var(--color-to)_calc(var(--size)*1deg),transparent_calc(var(--size)*1deg))_border-box]",
        "dark:[background:linear-gradient(#1A1A1A,#1A1A1A)_padding-box,conic-gradient(from_calc(var(--anchor)*1deg),var(--color-from)_0deg,var(--color-to)_calc(var(--size)*1deg),transparent_calc(var(--size)*1deg))_border-box]",
        "animate-border-beam",
        className
      )}
    />
  );
}
