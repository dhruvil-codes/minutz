"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";

function useFadeIn<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function BentoGrid() {
  const headingRef = useFadeIn<HTMLHeadingElement>();

  return (
    <section className="bg-gray-50 py-16 md:py-32 dark:bg-transparent">
      <div className="mx-auto max-w-3xl lg:max-w-5xl px-6">
        <h2
          ref={headingRef}
          className="text-3xl font-bold text-center mb-12 fade-section"
        >
          Everything you need — nothing you don&apos;t
        </h2>

        <div className="relative z-10 grid grid-cols-6 gap-3">

          {/* Cell 1 — Invisible Recording, col-span-full lg:col-span-2 */}
          <Card className="relative col-span-full flex overflow-hidden lg:col-span-2">
            <CardContent className="relative m-auto size-fit pt-6 w-full">
              <span className="absolute top-4 right-4 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6A00] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF6A00]" />
              </span>
              <h2 className="text-lg font-semibold mb-2">Invisible Recording</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                No bot joins your call. The Chrome Extension captures audio directly from your browser tab — invisible to every participant.
              </p>
            </CardContent>
          </Card>

          {/* Cell 2 — 60s Analysis, col-span-full sm:col-span-3 lg:col-span-2 */}
          <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-1">60s Analysis</h2>
              <p className="text-muted-foreground text-xs mb-5">Action items, ranked by urgency</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Follow up with Acme", count: 4 },
                  { label: "Schedule demo", count: 2 },
                  { label: "Send contract", count: 1 },
                ].map(({ label, count }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                    <span className="text-sm">{label}</span>
                    <span className="ml-3 shrink-0 rounded-full bg-[#FF6A00] text-white text-xs font-bold w-6 h-6 flex items-center justify-center">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cell 3 — Auto-Synced, col-span-full sm:col-span-3 lg:col-span-2 */}
          <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
            <CardContent className="pt-6">
              <div className="relative mx-auto flex aspect-square size-12 rounded-full border items-center justify-center mb-4 dark:border-white/10">
                <Shield className="size-5" strokeWidth={1} />
              </div>
              <div className="space-y-2 text-center">
                <h2 className="text-lg font-medium">Auto-Synced</h2>
                <p className="text-muted-foreground text-sm">Connect Slack, Notion, or HubSpot. No migration required.</p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {["Slack", "Notion", "HubSpot"].map((name) => (
                    <span key={name} className="px-3 py-1 rounded-full border text-xs font-medium text-muted-foreground">{name}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cell 4 — Niche Modes, col-span-full lg:col-span-3 */}
          <Card className="relative col-span-full overflow-hidden lg:col-span-3">
            <CardContent className="grid pt-6 sm:grid-cols-2">
              <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                <div className="relative flex aspect-square size-12 rounded-full border items-center justify-center dark:border-white/10">
                  <Shield className="size-5" strokeWidth={1} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-medium">Niche Intelligence</h2>
                  <p className="text-muted-foreground text-sm">Purpose-built modes for Sales, PM, and Financial teams.</p>
                </div>
              </div>
              <div className="relative mt-6 sm:ml-6 flex flex-col justify-center gap-3">
                {[
                  { label: "Sales Mode", badge: "Sales", badgeClass: "bg-[#FF6A00]/20 text-[#FF6A00]", desc: "Objections, deal signals, next steps." },
                  { label: "PM Mode", badge: "PM", badgeClass: "bg-purple-500/20 text-purple-400", desc: "Feature requests, pain points, themes." },
                  { label: "Financial Mode", badge: "Financial", badgeClass: "bg-green-500/20 text-green-400", desc: "Compliance flags, client goals, risk signals." },
                ].map(({ label, badge, badgeClass, desc }) => (
                  <div key={label} className="rounded-lg border bg-muted/40 px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{badge}</span>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cell 5 — Team, col-span-full lg:col-span-3 */}
          <Card className="relative col-span-full overflow-hidden lg:col-span-3">
            <CardContent className="grid h-full pt-6 sm:grid-cols-2">
              <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                <div className="relative flex aspect-square size-12 rounded-full border items-center justify-center dark:border-white/10">
                  <Users className="size-6" strokeWidth={1} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-medium">Built for fast-moving teams</h2>
                  <p className="text-muted-foreground text-sm">A prioritized inbox of what was decided and what to do next — not a note-taking tool.</p>
                </div>
              </div>
              <div className="before:bg-border relative mt-6 before:absolute before:inset-0 before:mx-auto before:w-px sm:-my-6 sm:-mr-6">
                <div className="relative flex h-full flex-col justify-center space-y-6 py-6">
                  {[
                    { name: "Rachel M.", role: "Sales Lead", items: 3, side: "right" },
                    { name: "Priya S.", role: "Product Manager", items: 8, side: "left" },
                    { name: "Victor L.", role: "Finance Director", items: 5, side: "right" },
                  ].map(({ name, role, items, side }) => (
                    <div key={name} className={`relative flex items-center gap-2 ${side === "right" ? "w-[calc(50%+0.875rem)] justify-end" : "ml-[calc(50%-1rem)]"}`}>
                      {side === "left" && (
                        <div className="ring-background size-8 ring-4 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {name[0]}
                        </div>
                      )}
                      <span className="block h-fit rounded border px-2 py-1 text-xs shadow-sm">{name} · {items} items</span>
                      {side === "right" && (
                        <div className="ring-background size-7 ring-4 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {name[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </section>
  );
}
