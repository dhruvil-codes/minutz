"use client";

import React from "react";
import { motion, useInView, type Variants } from "motion/react";

type TimelineContentProps = {
  as?: React.ElementType;
  animationNum?: number;
  timelineRef: React.RefObject<HTMLElement | null>;
  customVariants?: Variants;
  className?: string;
  children: React.ReactNode;
  href?: string;
} & React.HTMLAttributes<HTMLElement>;

const defaultVariants: Variants = {
  visible: (index: number) => ({
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      delay: index * 0.2,
      duration: 0.7,
    },
  }),
  hidden: {
    y: 24,
    opacity: 0,
    filter: "blur(10px)",
  },
};

export function TimelineContent({
  as = "div",
  animationNum = 0,
  timelineRef,
  customVariants,
  children,
  ...props
}: TimelineContentProps) {
  const isInView = useInView(timelineRef, { once: true, margin: "-20% 0px" });
  const MotionComponent = motion.create(as);

  return (
    <MotionComponent
      custom={animationNum}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={customVariants ?? defaultVariants}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
