"use client";

import React, {
    useEffect, useRef, useState, useCallback,
    forwardRef, useImperativeHandle, useMemo,
    type ReactNode, type SVGProps,
} from "react";
import Image from "next/image";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import HeroBadge from "@/components/ui/hero-badge";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
    Navbar, NavBody, NavItems, NavbarLogo, NavbarButton,
    MobileNav, MobileNavHeader, MobileNavToggle, MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import {
    motion, AnimatePresence,
    type Transition, type VariantLabels, type Target,
    type TargetAndTransition, type Variants,
} from "framer-motion";

function cn(...classes: (string | undefined | null | boolean)[]): string {
    return classes.filter(Boolean).join(" ");
}

const worksWithTools = [
    { id: 1, name: "Slack", image: "/slack.png" },
    { id: 2, name: "Notion", image: "/notion.png" },
    { id: 3, name: "HubSpot", image: "/hubspot.png" },
    { id: 4, name: "Linear", image: "/linear.png" },
    { id: 5, name: "Zoom", image: "/zoom.png" },
    { id: 6, name: "Google Meet", image: "/google-meet.png" },
];

interface RotatingTextRef { next: () => void; previous: () => void; jumpTo: (index: number) => void; reset: () => void; }

interface RotatingTextProps extends Omit<React.ComponentPropsWithoutRef<typeof motion.span>, "children" | "transition" | "initial" | "animate" | "exit"> {
    texts: string[]; transition?: Transition; initial?: boolean | Target | VariantLabels;
    animate?: boolean | VariantLabels | TargetAndTransition;
    exit?: Target | VariantLabels; animatePresenceMode?: "sync" | "wait"; animatePresenceInitial?: boolean;
    rotationInterval?: number; staggerDuration?: number; staggerFrom?: "first" | "last" | "center" | "random" | number;
    loop?: boolean; auto?: boolean; splitBy?: "characters" | "words" | "lines" | string;
    onNext?: (index: number) => void; mainClassName?: string; splitLevelClassName?: string; elementLevelClassName?: string;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(({
    texts, transition = { type: "spring", damping: 25, stiffness: 300 },
    initial = { y: "100%", opacity: 0 }, animate = { y: 0, opacity: 1 }, exit = { y: "-120%", opacity: 0 },
    animatePresenceMode = "wait", animatePresenceInitial = false, rotationInterval = 2200,
    staggerDuration = 0.01, staggerFrom = "last", loop = true, auto = true, splitBy = "characters",
    onNext, mainClassName, splitLevelClassName, elementLevelClassName, ...rest
}, ref) => {
    const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);

    const splitIntoCharacters = (text: string): string[] => {
        if (typeof Intl !== "undefined" && Intl.Segmenter) {
            try { const s = new Intl.Segmenter("en", { granularity: "grapheme" }); return Array.from(s.segment(text), seg => seg.segment); }
            catch { return text.split(""); }
        }
        return text.split("");
    };

    const elements = useMemo(() => {
        const currentText: string = texts[currentTextIndex] ?? "";
        if (splitBy === "characters") {
            const words = currentText.split(/(\s+)/); let charCount = 0;
            return words.filter(p => p.length > 0).map(part => {
                const isSpace = /^\s+$/.test(part); const chars = isSpace ? [part] : splitIntoCharacters(part);
                const startIndex = charCount; charCount += chars.length;
                return { characters: chars, isSpace, startIndex };
            });
        }
        if (splitBy === "words") return currentText.split(/(\s+)/).filter(w => w.length > 0).map((word, i) => ({ characters: [word], isSpace: /^\s+$/.test(word), startIndex: i }));
        if (splitBy === "lines") return currentText.split("\n").map((line, i) => ({ characters: [line], isSpace: false, startIndex: i }));
        return currentText.split(splitBy).map((part, i) => ({ characters: [part], isSpace: false, startIndex: i }));
    }, [texts, currentTextIndex, splitBy]);

    const totalElements = useMemo(() => elements.reduce((sum, el) => sum + el.characters.length, 0), [elements]);

    const getStaggerDelay = useCallback((index: number, total: number): number => {
        if (total <= 1 || !staggerDuration) return 0;
        const stagger = staggerDuration;
        switch (staggerFrom) {
            case "first": return index * stagger;
            case "last": return (total - 1 - index) * stagger;
            case "center": return Math.abs((total - 1) / 2 - index) * stagger;
            case "random": return Math.random() * (total - 1) * stagger;
            default: if (typeof staggerFrom === "number") return Math.abs(Math.max(0, Math.min(staggerFrom, total - 1)) - index) * stagger; return index * stagger;
        }
    }, [staggerFrom, staggerDuration]);

    const handleIndexChange = useCallback((newIndex: number) => { setCurrentTextIndex(newIndex); onNext?.(newIndex); }, [onNext]);
    const next = useCallback(() => { const n = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1; if (n !== currentTextIndex) handleIndexChange(n); }, [currentTextIndex, texts.length, loop, handleIndexChange]);
    const previous = useCallback(() => { const p = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1; if (p !== currentTextIndex) handleIndexChange(p); }, [currentTextIndex, texts.length, loop, handleIndexChange]);
    const jumpTo = useCallback((index: number) => { const v = Math.max(0, Math.min(index, texts.length - 1)); if (v !== currentTextIndex) handleIndexChange(v); }, [texts.length, currentTextIndex, handleIndexChange]);
    const reset = useCallback(() => { if (currentTextIndex !== 0) handleIndexChange(0); }, [currentTextIndex, handleIndexChange]);
    useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [next, previous, jumpTo, reset]);
    useEffect(() => { if (!auto || texts.length <= 1) return; const id = setInterval(next, rotationInterval); return () => clearInterval(id); }, [next, rotationInterval, auto, texts.length]);

    return (
        <motion.span className={cn("inline-flex flex-wrap whitespace-pre-wrap relative align-bottom pb-[10px]", mainClassName)} {...rest} layout>
            <span className="sr-only">{texts[currentTextIndex]}</span>
            <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
                <motion.div key={currentTextIndex} className={cn("inline-flex flex-wrap relative", splitBy === "lines" ? "flex-col items-start w-full" : "flex-row items-baseline")} layout aria-hidden="true" initial="initial" animate="animate" exit="exit">
                    {elements.map((elementObj, elementIndex) => (
                        <span key={elementIndex} className={cn("inline-flex", splitBy === "lines" ? "w-full" : "", splitLevelClassName)} style={{ whiteSpace: "pre" }}>
                            {elementObj.characters.map((char, charIndex) => {
                                const globalIndex = elementObj.startIndex + charIndex;
                                return (
                                    <motion.span key={char + "-" + charIndex} initial={initial} animate={animate} exit={exit} transition={{ ...transition, delay: getStaggerDelay(globalIndex, totalElements) }} className={cn("inline-block leading-none tracking-tight", elementLevelClassName)}>
                                        {char === " " ? " " : char}
                                    </motion.span>
                                );
                            })}
                        </span>
                    ))}
                </motion.div>
            </AnimatePresence>
        </motion.span>
    );
});
RotatingText.displayName = "RotatingText";

const ShinyText: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => (
    <span className={cn("relative overflow-hidden inline-block", className)}>
        {text}
        <span style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", animation: "shine 2s infinite linear", opacity: 0.5, pointerEvents: "none" }} />
    </span>
);

const MenuIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const CloseIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

interface NavLinkProps { href?: string; children: ReactNode; className?: string; onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void; }

const NavLink: React.FC<NavLinkProps> = ({ href = "#", children, className = "", onClick }) => (
    <motion.a href={href} onClick={onClick} className={cn("relative group flex items-center py-1 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text-primary)]", className)} whileHover="hover">
        {children}
        <motion.div className="absolute bottom-[-2px] left-0 right-0 h-[1px] bg-[#FF6A00]" variants={{ initial: { scaleX: 0, originX: 0.5 }, hover: { scaleX: 1, originX: 0.5 } }} initial="initial" transition={{ duration: 0.3, ease: "easeOut" }} />
    </motion.a>
);

interface Dot { x: number; y: number; baseColor: string; targetOpacity: number; currentOpacity: number; opacitySpeed: number; baseRadius: number; currentRadius: number; }

const InteractiveHero: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

    const navItems = [
        { name: "Features", link: "#features" },
        { name: "Pricing", link: "#pricing" },
        { name: "About", link: "#about" },
    ];

    const dotsRef = useRef<Dot[]>([]);
    const gridRef = useRef<Record<string, number[]>>({});
    const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
    const mousePositionRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

    const DOT_SPACING = 25;
    const BASE_OPACITY_MIN = 0.40;
    const BASE_OPACITY_MAX = 0.50;
    const BASE_RADIUS = 1;
    const INTERACTION_RADIUS = 150;
    const INTERACTION_RADIUS_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS;
    const OPACITY_BOOST = 0.6;
    const RADIUS_BOOST = 2.5;
    const GRID_CELL_SIZE = Math.max(50, Math.floor(INTERACTION_RADIUS / 1.5));

    const handleMouseMove = useCallback((event: globalThis.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) { mousePositionRef.current = { x: null, y: null }; return; }
        const rect = canvas.getBoundingClientRect();
        mousePositionRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }, []);

    const createDots = useCallback(() => {
        const { width, height } = canvasSizeRef.current;
        if (width === 0 || height === 0) return;
        const newDots: Dot[] = []; const newGrid: Record<string, number[]> = {};
        const cols = Math.ceil(width / DOT_SPACING); const rows = Math.ceil(height / DOT_SPACING);
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * DOT_SPACING + DOT_SPACING / 2; const y = j * DOT_SPACING + DOT_SPACING / 2;
                const cellKey = `${Math.floor(x / GRID_CELL_SIZE)}_${Math.floor(y / GRID_CELL_SIZE)}`;
                if (!newGrid[cellKey]) newGrid[cellKey] = [];
                const dotIndex = newDots.length; newGrid[cellKey].push(dotIndex);
                const baseOpacity = Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) + BASE_OPACITY_MIN;
                newDots.push({ x, y, baseColor: `rgba(255, 106, 0, ${BASE_OPACITY_MAX})`, targetOpacity: baseOpacity, currentOpacity: baseOpacity, opacitySpeed: (Math.random() * 0.005) + 0.002, baseRadius: BASE_RADIUS, currentRadius: BASE_RADIUS });
            }
        }
        dotsRef.current = newDots; gridRef.current = newGrid;
    }, [DOT_SPACING, GRID_CELL_SIZE, BASE_OPACITY_MIN, BASE_OPACITY_MAX, BASE_RADIUS]);

    const handleResize = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const container = canvas.parentElement;
        const width = container ? container.clientWidth : window.innerWidth;
        const height = container ? container.clientHeight : window.innerHeight;
        if (canvas.width !== width || canvas.height !== height || canvasSizeRef.current.width !== width || canvasSizeRef.current.height !== height) {
            canvas.width = width; canvas.height = height; canvasSizeRef.current = { width, height }; createDots();
        }
    }, [createDots]);

    const animateDots = useCallback(() => {
        const canvas = canvasRef.current; const ctx = canvas?.getContext("2d");
        const dots = dotsRef.current; const grid = gridRef.current;
        const { width, height } = canvasSizeRef.current; const { x: mouseX, y: mouseY } = mousePositionRef.current;
        if (!ctx || !dots || !grid || width === 0 || height === 0) { animationFrameId.current = requestAnimationFrame(animateDots); return; }
        ctx.clearRect(0, 0, width, height);
        const activeDotIndices = new Set<number>();
        if (mouseX !== null && mouseY !== null) {
            const mouseCellX = Math.floor(mouseX / GRID_CELL_SIZE); const mouseCellY = Math.floor(mouseY / GRID_CELL_SIZE);
            const searchRadius = Math.ceil(INTERACTION_RADIUS / GRID_CELL_SIZE);
            for (let i = -searchRadius; i <= searchRadius; i++) for (let j = -searchRadius; j <= searchRadius; j++) { const key = `${mouseCellX + i}_${mouseCellY + j}`; if (grid[key]) grid[key].forEach(idx => activeDotIndices.add(idx)); }
        }
        dots.forEach((dot, index) => {
            dot.currentOpacity += dot.opacitySpeed;
            if (dot.currentOpacity >= dot.targetOpacity || dot.currentOpacity <= BASE_OPACITY_MIN) {
                dot.opacitySpeed = -dot.opacitySpeed;
                dot.currentOpacity = Math.max(BASE_OPACITY_MIN, Math.min(dot.currentOpacity, BASE_OPACITY_MAX));
                dot.targetOpacity = Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) + BASE_OPACITY_MIN;
            }
            let interactionFactor = 0; dot.currentRadius = dot.baseRadius;
            if (mouseX !== null && mouseY !== null && activeDotIndices.has(index)) {
                const dx = dot.x - mouseX; const dy = dot.y - mouseY; const distSq = dx * dx + dy * dy;
                if (distSq < INTERACTION_RADIUS_SQ) { const distance = Math.sqrt(distSq); interactionFactor = Math.pow(Math.max(0, 1 - distance / INTERACTION_RADIUS), 2); }
            }
            const finalOpacity = Math.min(1, dot.currentOpacity + interactionFactor * OPACITY_BOOST);
            dot.currentRadius = dot.baseRadius + interactionFactor * RADIUS_BOOST;
            ctx.beginPath(); ctx.fillStyle = `rgba(255, 106, 0, ${finalOpacity.toFixed(3)})`; ctx.arc(dot.x, dot.y, dot.currentRadius, 0, Math.PI * 2); ctx.fill();
        });
        animationFrameId.current = requestAnimationFrame(animateDots);
    }, [GRID_CELL_SIZE, INTERACTION_RADIUS, INTERACTION_RADIUS_SQ, OPACITY_BOOST, RADIUS_BOOST, BASE_OPACITY_MIN, BASE_OPACITY_MAX, BASE_RADIUS]);

    useEffect(() => {
        handleResize();
        const handleMouseLeave = () => { mousePositionRef.current = { x: null, y: null }; };
        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("resize", handleResize);
        document.documentElement.addEventListener("mouseleave", handleMouseLeave);
        animationFrameId.current = requestAnimationFrame(animateDots);
        return () => {
            window.removeEventListener("resize", handleResize); window.removeEventListener("mousemove", handleMouseMove);
            document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [handleResize, handleMouseMove, animateDots]);

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isMobileMenuOpen]);

    const d = 0.3; const inc = 0.1;
    const bannerV: Variants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: d } } };
    const headlineV: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, delay: d + inc } } };
    const subV: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: d + inc * 2 } } };
    const ctaV: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: d + inc * 3 } } };
    const trialV: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, delay: d + inc * 4 } } };
    const worksV: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, delay: d + inc * 5 } } };
    const imageV: Variants = { hidden: { opacity: 0, scale: 0.95, y: 20 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, delay: d + inc * 6, ease: [0.16, 1, 0.3, 1] } } };

    return (
        <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-[var(--color-text-secondary)]">
            <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />
            <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent 0%, var(--color-bg) 90%), radial-gradient(ellipse at center, transparent 40%, var(--color-bg) 95%)" }} />

            {/* Navbar */}
            <div className="relative z-30 w-full">
                <Navbar>
                    <NavBody>
                        <NavbarLogo />
                        <NavItems items={navItems} />
                        <div className="flex items-center gap-4">
                            <AnimatedThemeToggler
                                className="relative z-[80] inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:border-[#FF6A00]/50 hover:text-[var(--color-text-primary)]"
                                aria-label="Toggle theme"
                            />
                            <NavbarButton href="/login" variant="secondary">Sign in</NavbarButton>
                            <NavbarButton href="/login" variant="dark">Get started free</NavbarButton>
                        </div>
                    </NavBody>
                    <MobileNav>
                        <MobileNavHeader>
                            <NavbarLogo />
                            <MobileNavToggle isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
                        </MobileNavHeader>
                        <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
                            {navItems.map((item, idx) => (
                                <a key={idx} href={item.link} onClick={() => setIsMobileMenuOpen(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                                    {item.name}
                                </a>
                            ))}
                            <div className="flex w-full flex-col gap-3 pt-2">
                                <AnimatedThemeToggler
                                    className="relative z-[80] inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:border-[#FF6A00]/50 hover:text-[var(--color-text-primary)]"
                                    aria-label="Toggle theme"
                                />
                                <NavbarButton href="/login" variant="secondary" className="w-full text-center">Sign in</NavbarButton>
                                <NavbarButton href="/login" variant="dark" className="w-full text-center">Get started free</NavbarButton>
                            </div>
                        </MobileNavMenu>
                    </MobileNav>
                </Navbar>
            </div>

            {/* Hero content */}
            <main className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-32 pb-16 relative z-10">
                <motion.div variants={bannerV} initial="hidden" animate="visible" className="mb-6">
                    <HeroBadge
                        text="⚡ Now in beta — invisible AI meeting intelligence"
                        variant="outline"
                        size="md"
                        className="border-[var(--color-border)] bg-[var(--color-surface)] text-[#FF6A00] hover:border-[#FF6A00]/50"
                    />
                </motion.div>

                <motion.h1 variants={headlineV} initial="hidden" animate="visible" className="mb-4 max-w-4xl text-4xl font-semibold leading-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-[64px]">
                    Your meetings,{" "}
                    <span className="inline-block overflow-hidden align-bottom">
                        <RotatingText
                            texts={["useful.", "actionable.", "intelligent.", "clear.", "done."]}
                            mainClassName="text-[#FF6A00] mx-1"
                            staggerFrom="last"
                            initial={{ y: "-100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "110%", opacity: 0 }}
                            staggerDuration={0.01}
                            transition={{ type: "spring", damping: 18, stiffness: 250 }}
                            rotationInterval={2200}
                            splitBy="characters"
                            auto={true}
                            loop={true}
                        />
                    </span>
                </motion.h1>

                <motion.p variants={subV} initial="hidden" animate="visible" className="mx-auto mb-8 max-w-2xl text-base text-[var(--color-text-secondary)] sm:text-lg lg:text-xl">
                    Record invisibly. Get executive summaries, action items, and decisions in 60 seconds. Auto-synced to Slack, Notion, and HubSpot.
                </motion.p>

                <motion.div variants={ctaV} initial="hidden" animate="visible" className="mb-3 flex justify-center gap-3">
                    <a href="/login" className="rounded-md bg-[#FF6A00] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E55E00]">Start for free</a>
                    <a href="#demo" className="rounded-md border border-[var(--color-border)] px-6 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]">Watch demo</a>
                </motion.div>

                <motion.p variants={trialV} initial="hidden" animate="visible" className="mb-10 text-xs text-[var(--color-text-secondary)]">
                    No credit card required · No bot joins your call
                </motion.p>

                <motion.div variants={worksV} initial="hidden" animate="visible" className="mb-10 flex flex-col items-center justify-center space-y-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">Works with</span>
                    <AnimatedTooltip items={worksWithTools} />
                </motion.div>

                <motion.div variants={imageV} initial="hidden" animate="visible" className="mx-auto w-full max-w-4xl px-4 sm:px-0">
                    <div className="relative mx-auto aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                        <Image
                            src="/dashboard.png"
                            alt="Minutz dashboard preview"
                            fill
                            priority
                            className="object-cover object-top"
                        />
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default InteractiveHero;
