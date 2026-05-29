"use client";

import { ChevronRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  textColor?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: number | string;
}

const footerColumns = [
  {
    title: "Product",
    links: [
      { title: "Features", href: "#features" },
      { title: "Pricing", href: "#pricing" },
      { title: "Dashboard", href: "/dashboard" },
      { title: "Chrome extension", href: "#install" },
    ],
  },
  {
    title: "Integrations",
    links: [
      { title: "Google Meet", href: "#integrations" },
      { title: "Slack", href: "#integrations" },
      { title: "Notion", href: "#integrations" },
      { title: "HubSpot", href: "#integrations" },
    ],
  },
  {
    title: "Use cases",
    links: [
      { title: "Sales teams", href: "#use-cases" },
      { title: "Product teams", href: "#use-cases" },
      { title: "Client calls", href: "#use-cases" },
      { title: "Async recaps", href: "#use-cases" },
    ],
  },
  {
    title: "Company",
    links: [
      { title: "About", href: "#about" },
      { title: "Privacy", href: "/privacy" },
      { title: "Terms", href: "/terms" },
      { title: "Contact", href: "mailto:hello@minutz.ai" },
    ],
  },
];

const trustItems = [
  { label: "Private by default", Icon: ShieldCheck },
  { label: "Encrypted notes", Icon: LockKeyhole },
  { label: "No bot joins", Icon: Sparkles },
];

function fillStyle(rgb: string, opacity: number) {
  return `rgba(${rgb}, ${Math.max(0, Math.min(1, opacity))})`;
}

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateValue = () => setValue(mediaQuery.matches);

    updateValue();
    mediaQuery.addEventListener("change", updateValue);

    return () => mediaQuery.removeEventListener("change", updateValue);
  }, [query]);

  return value;
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 2,
  gridGap = 3,
  flickerChance = 0.12,
  color = "255, 106, 0",
  textColor = "255, 239, 225",
  width,
  height,
  className,
  maxOpacity = 0.18,
  text = "",
  fontSize = 96,
  fontWeight = 700,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number,
    ) => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      let maskCtx: CanvasRenderingContext2D | null = null;

      if (text) {
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = canvasWidth;
        maskCanvas.height = canvasHeight;
        maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });

        if (maskCtx) {
          maskCtx.save();
          maskCtx.scale(dpr, dpr);
          maskCtx.fillStyle = "white";
          maskCtx.font = `${fontWeight} ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
          maskCtx.textAlign = "center";
          maskCtx.textBaseline = "middle";
          maskCtx.fillText(text, canvasWidth / (2 * dpr), canvasHeight / (2 * dpr));
          maskCtx.restore();
        }
      }

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const x = col * (squareSize + gridGap) * dpr;
          const y = row * (squareSize + gridGap) * dpr;
          const squareWidth = squareSize * dpr;
          const squareHeight = squareSize * dpr;
          const opacity = squares[col * rows + row];
          let isTextPixel = false;

          if (maskCtx) {
            const maskData = maskCtx.getImageData(x, y, squareWidth, squareHeight).data;
            isTextPixel = maskData.some((value, index) => index % 4 === 3 && value > 0);
          }

          ctx.fillStyle = isTextPixel
            ? fillStyle(textColor, Math.min(0.95, opacity * 3.5 + 0.34))
            : fillStyle(color, opacity);
          ctx.fillRect(x, y, squareWidth, squareHeight);
        }
      }
    },
    [color, fontSize, fontWeight, gridGap, squareSize, text, textColor],
  );

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, nextWidth: number, nextHeight: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = nextWidth * dpr;
      canvas.height = nextHeight * dpr;
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;

      const cols = Math.ceil(nextWidth / (squareSize + gridGap));
      const rows = Math.ceil(nextHeight / (squareSize + gridGap));
      const squares = new Float32Array(cols * rows);

      for (let index = 0; index < squares.length; index++) {
        squares[index] = Math.random() * maxOpacity;
      }

      return { cols, rows, squares, dpr };
    },
    [gridGap, maxOpacity, squareSize],
  );

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let index = 0; index < squares.length; index++) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[index] = Math.random() * maxOpacity;
        }
      }
    },
    [flickerChance, maxOpacity],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let lastTime = 0;
    let gridParams: ReturnType<typeof setupCanvas>;

    const updateCanvasSize = () => {
      const nextWidth = width || container.clientWidth;
      const nextHeight = height || container.clientHeight;

      setCanvasSize({ width: nextWidth, height: nextHeight });
      gridParams = setupCanvas(canvas, nextWidth, nextHeight);
      drawGrid(ctx, canvas.width, canvas.height, gridParams.cols, gridParams.rows, gridParams.squares, gridParams.dpr);
    };

    const animate = (time: number) => {
      if (!isInView) return;

      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      updateSquares(gridParams.squares, deltaTime);
      drawGrid(ctx, canvas.width, canvas.height, gridParams.cols, gridParams.rows, gridParams.squares, gridParams.dpr);
      animationFrameId = requestAnimationFrame(animate);
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    if (isInView) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [drawGrid, height, isInView, setupCanvas, updateSquares, width]);

  return (
    <div ref={containerRef} className={cn("h-full w-full", className)} {...props}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none block"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
    </div>
  );
};

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className =
    "group inline-flex items-center gap-1.5 text-[15px] text-zinc-400 transition-colors duration-200 hover:text-[#ff7a1a]";

  const content = (
    <>
      <span>{children}</span>
      <ChevronRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
    </>
  );

  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export function FlickeringFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const compact = useMediaQuery("(max-width: 768px)");
  const particleText = useMemo(() => (compact ? "Minutz" : "your meeting, actionable"), [compact]);

  return (
    <footer
      id="footer"
      className={cn(
        "relative overflow-hidden border-t border-white/[0.06] bg-[#030201] text-white",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[320px] opacity-80">
        <FlickeringGrid
          text={particleText}
          fontSize={compact ? 62 : 92}
          fontWeight={800}
          className="h-full w-full"
          squareSize={2}
          gridGap={compact ? 2 : 3}
          color="82, 82, 91"
          textColor="255, 106, 0"
          maxOpacity={0.16}
          flickerChance={0.14}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030201] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#030201] to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-6 pt-16 md:px-10 lg:px-12 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1.95fr] lg:gap-20">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/logo-light.png"
                alt="Minutz"
                width={118}
                height={32}
                className="h-auto w-[118px] dark:hidden"
              />
              <Image
                src="/logo-dark.png"
                alt="Minutz"
                width={118}
                height={32}
                className="hidden h-auto w-[118px] dark:block"
              />
            </Link>

            <p className="mt-6 text-balance text-lg leading-8 text-zinc-300">
              Invisible AI meeting intelligence that turns every call into decisions,
              action items, and clean follow-through.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {trustItems.map(({ label, Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 text-xs font-medium text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                >
                  <Icon className="h-3.5 w-3.5 text-[#ff7a1a]" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:pt-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-100">
                  {column.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.title}`}>
                      <FooterLink href={link.href}>{link.title}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="h-44 md:h-56" aria-hidden="true" />

        <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>
            2026 Minutz | Built by{" "}
            <a
              href="https://x.com/bydhruvil"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 transition-colors hover:text-[#ff7a1a]"
            >
              @bydhruvil
            </a>
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="transition-colors hover:text-zinc-300">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-zinc-300">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export const Component = FlickeringFooter;
