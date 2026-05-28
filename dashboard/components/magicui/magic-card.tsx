"use client";

import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useRef } from "react";

interface MagicCardProps {
  children?: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#FF6A00",
  gradientOpacity = 0.08,
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!cardRef.current || !gradientRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    gradientRef.current.style.background = `radial-gradient(${gradientSize}px circle at ${x}px ${y}px, ${gradientColor}, transparent 100%)`;
    gradientRef.current.style.opacity = String(gradientOpacity * 10);
  }, [gradientSize, gradientColor, gradientOpacity]);

  const handleMouseLeave = useCallback(() => {
    if (!gradientRef.current) return;
    gradientRef.current.style.opacity = "0";
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div ref={cardRef} className={cn("relative overflow-hidden", className)}>
      <div
        ref={gradientRef}
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300"
      />
      {children}
    </div>
  );
}
