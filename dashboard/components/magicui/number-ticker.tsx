"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  className?: string;
  decimalPlaces?: number;
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const start = direction === "down" ? value : 0;
    const end = direction === "down" ? 0 : value;
    const duration = 1500;
    let startTime: number | null = null;

    const timer = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * eased;
        if (el) el.textContent = current.toFixed(decimalPlaces);
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(step);
        }
      };
      animationRef.current = requestAnimationFrame(step);
    }, delay * 1000);

    return () => {
      clearTimeout(timer);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, direction, delay, decimalPlaces]);

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums", className)}
    >
      0
    </span>
  );
}
