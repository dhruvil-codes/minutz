"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type AnimatedTooltipItem = {
  id: number;
  name: string;
  image: string;
};

export function AnimatedTooltip({
  items,
  className,
}: {
  items: AnimatedTooltipItem[];
  className?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {items.map((item, index) => (
        <div
          className="-mr-3 flex"
          key={item.id}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="absolute -translate-x-1/2 -translate-y-14 rounded-md border border-white/10 bg-black px-3 py-1.5 text-xs font-medium text-white shadow-xl"
                style={{ left: "50%" }}
              >
                <div className="absolute inset-x-0 -bottom-px mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-[#FF6A00] to-transparent" />
                <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-black" />
                {item.name}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-black bg-[#111111] p-2 shadow-sm transition-colors hover:z-30 hover:border-[#FF6A00]/50"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.08, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            style={{ zIndex: items.length - index }}
          >
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="40px"
              className="object-contain p-2"
            />
          </motion.div>
        </div>
      ))}
    </div>
  );
}
