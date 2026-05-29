"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type FooterLinkColumn = {
  title: string;
  links: {
    id: number;
    title: string;
    url: string;
  }[];
};

const footerLinks: FooterLinkColumn[] = [
  {
    title: "Product",
    links: [
      { id: 1, title: "Features", url: "#features" },
      { id: 2, title: "Pricing", url: "#pricing" },
      { id: 3, title: "Dashboard", url: "/dashboard" },
      { id: 4, title: "Chrome Extension", url: "#" },
    ],
  },
  {
    title: "Integrations",
    links: [
      { id: 5, title: "Slack", url: "#" },
      { id: 6, title: "Notion", url: "#" },
      { id: 7, title: "HubSpot", url: "#" },
      { id: 8, title: "Linear", url: "#" },
    ],
  },
  {
    title: "Use Cases",
    links: [
      { id: 9, title: "Sales Teams", url: "#" },
      { id: 10, title: "Product Managers", url: "#" },
      { id: 11, title: "Financial Advisors", url: "#" },
      { id: 12, title: "Operations", url: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { id: 13, title: "About", url: "#" },
      { id: 14, title: "Privacy", url: "#" },
      { id: 15, title: "Terms", url: "#" },
      { id: 16, title: "Contact", url: "mailto:hello@minutz.ai" },
    ],
  },
];

const trustBadges = ["SOC 2 ready", "Encrypted", "No bot joins"];

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  maxOpacity?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: number | string;
}

function FlickeringGrid({
  squareSize = 3,
  gridGap = 3,
  flickerChance = 0.12,
  color = "255, 106, 0",
  maxOpacity = 0.28,
  text = "",
  fontSize = 96,
  fontWeight = 700,
  className,
  ...props
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number,
    ) => {
      ctx.clearRect(0, 0, width, height);

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!maskCtx) return;

      if (text) {
        maskCtx.save();
        maskCtx.scale(dpr, dpr);
        maskCtx.fillStyle = "white";
        maskCtx.font = `${fontWeight} ${fontSize}px var(--font-inter), system-ui, sans-serif`;
        maskCtx.textAlign = "center";
        maskCtx.textBaseline = "middle";
        maskCtx.fillText(text, width / (2 * dpr), height / (2 * dpr));
        maskCtx.restore();
      }

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const x = col * (squareSize + gridGap) * dpr;
          const y = row * (squareSize + gridGap) * dpr;
          const squareWidth = squareSize * dpr;
          const squareHeight = squareSize * dpr;
          const maskData = maskCtx.getImageData(x, y, squareWidth, squareHeight).data;
          const hasText = maskData.some((value, index) => index % 4 === 0 && value > 0);
          const opacity = squares[col * rows + row];

          ctx.fillStyle = `rgba(${color}, ${hasText ? Math.min(0.9, opacity * 3 + 0.18) : opacity})`;
          ctx.fillRect(x, y, squareWidth, squareHeight);
        }
      }
    },
    [color, fontSize, fontWeight, gridGap, squareSize, text],
  );

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, width: number, height: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const cols = Math.ceil(width / (squareSize + gridGap));
      const rows = Math.ceil(height / (squareSize + gridGap));
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

    let animationFrameId: number;
    let gridParams = setupCanvas(canvas, container.clientWidth, container.clientHeight);
    let lastTime = 0;

    const updateCanvasSize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      setCanvasSize({ width, height });
      gridParams = setupCanvas(canvas, width, height);
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

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    });

    updateCanvasSize();
    resizeObserver.observe(container);
    intersectionObserver.observe(canvas);

    if (isInView) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [drawGrid, isInView, setupCanvas, updateSquares]);

  return (
    <div ref={containerRef} className={cn("h-full w-full", className)} {...props}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      />
    </div>
  );
}

function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setValue(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return value;
}

export function Footer() {
  const tablet = useMediaQuery("(max-width: 1024px)");
  const gridText = useMemo(() => (tablet ? "Minutz" : "Make meetings useful"), [tablet]);

  return (
    <footer id="footer" className="relative overflow-hidden bg-black pb-0 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col items-start gap-5">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-dark.png" alt="Minutz" width={104} height={26} className="h-auto" />
          </Link>
          <p className="text-sm font-medium leading-relaxed text-[#A3A3A3]">
            Invisible AI meeting intelligence for teams that need decisions, action items, and summaries before the tab closes.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-[#A3A3A3]"
              >
                {badge}
              </span>
            ))}
          </div>
          <p className="text-xs text-[#6B6B6B]">
            © 2026 Minutz. Built by{' '}
            <a href="https://x.com/bydhruvil" target="_blank" rel="noopener noreferrer">
              @bydhruvil
            </a>
            .
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-8 md:max-w-2xl md:grid-cols-4">
          {footerLinks.map((column) => (
            <ul key={column.title} className="flex flex-col gap-2">
              <li className="mb-2 text-sm font-semibold text-white">{column.title}</li>
              {column.links.map((link) => (
                <li
                  key={link.id}
                  className="group inline-flex w-fit cursor-pointer items-center justify-start gap-1 text-sm text-[#A3A3A3] transition-colors hover:text-white"
                >
                  <Link href={link.url}>{link.title}</Link>
                  <span className="flex size-4 translate-x-0 items-center justify-center rounded border border-white/10 text-[#FF6A00] opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100">
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="relative z-0 mt-12 h-48 w-full md:h-64">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-transparent from-40% to-black" />
        <div className="absolute inset-0 mx-6">
          <FlickeringGrid
            text={gridText}
            fontSize={tablet ? 72 : 104}
            className="h-full w-full"
            squareSize={2}
            gridGap={tablet ? 2 : 3}
            color="255, 106, 0"
            maxOpacity={0.3}
            flickerChance={0.1}
          />
        </div>
      </div>
    </footer>
  );
}
