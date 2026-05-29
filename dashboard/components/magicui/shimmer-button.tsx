"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { CSSProperties } from "react";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  target?: string;
  rel?: string;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor,
      shimmerSize,
      shimmerDuration,
      borderRadius = "8px",
      background = "#FF6A00",
      className,
      children,
      href,
      target,
      rel,
      ...props
    },
    ref
  ) => {
    const sharedClassName = cn(
      "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white [background:var(--bg)] [border-radius:var(--radius)]",
      "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
      className
    );

    const sharedStyle = {
      "--radius": borderRadius,
      "--bg": background,
    } as CSSProperties;

    const content = (
      <>
        {children}
        <div
          className={cn(
            "insert-0 absolute size-full",
            "rounded-2xl px-4 py-1.5 text-sm font-semibold",
            "bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]",
            "shadow-[inset_0_-8px_10px_#ffffff12]",
            "transform-gpu transition-all duration-300 ease-in-out",
            "group-hover:shadow-[inset_0_-8px_10px_#ffffff18]",
            "group-active:shadow-[inset_0_-10px_10px_#ffffff18]"
          )}
        />
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          target={target}
          rel={rel}
          className={sharedClassName}
          style={sharedStyle}
        >
          {content}
        </Link>
      );
    }

    return (
      <button style={sharedStyle} className={sharedClassName} ref={ref} {...props}>
        {content}
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";
