"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Switch } from "@/components/ui/switch";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const plans = [
  {
    name: "Starter",
    monthly: 0,
    annual: 0,
    tagline: "The essentials to start capturing meeting intelligence.",
    features: ["5 meetings/month", "Chrome Extension", "Basic summary", "Action items", "7-day history"],
    popular: false,
    perSeat: false,
  },
  {
    name: "Pro",
    monthly: 19,
    annual: 15,
    tagline: "Everything you need for unlimited meeting intelligence.",
    features: ["Unlimited meetings", "All niche modes", "Slack + Notion sync", "Priority processing", "Full history"],
    popular: true,
    perSeat: false,
  },
  {
    name: "Team",
    monthly: 12,
    annual: 10,
    tagline: "For fast-moving teams that need shared intelligence.",
    features: ["Everything in Pro", "Team analytics", "HubSpot sync", "Admin controls", "Priority support"],
    popular: false,
    perSeat: true,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="bg-background py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Simple pricing. Scale when you&apos;re ready.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-[var(--color-text-secondary)]">
            Start free. Upgrade when your team needs more.
          </p>
        </motion.div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!annual ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>Monthly</span>
          <Switch checked={annual} onCheckedChange={setAnnual} className="data-[state=checked]:bg-[#FF6A00]" aria-label="Toggle annual billing" />
          <span className={`flex items-center gap-2 text-sm font-medium ${annual ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
            Annually
            <span className="rounded-full bg-[#FFF3E8] px-2 py-0.5 text-xs font-semibold text-[#FF6A00] dark:bg-[#2A1800]">Save 20%</span>
          </span>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              className={`relative flex flex-col overflow-hidden rounded-xl p-7 ${
                plan.popular
                  ? "border-2 border-[#FF6A00] bg-[var(--color-surface-raised)]"
                  : "border border-[var(--color-border)] bg-[var(--color-surface-raised)]"
              }`}
            >
              {plan.popular && (
                <>
                  <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#FF6A00] to-[#FFB347]" />
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[#FF6A00] px-3 py-1 text-xs font-semibold text-white">Popular</span>
                  </div>
                  <BorderBeam colorFrom="#FF6A00" colorTo="#FFB347" size={120} duration={10} />
                </>
              )}

              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">{plan.name}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-5xl font-bold tracking-tight text-[var(--color-text-primary)]">
                  ${annual ? plan.annual : plan.monthly}
                </span>
                <span className="mb-1.5 text-sm text-[var(--color-text-secondary)]">{plan.perSeat ? "/seat/mo" : "/month"}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{plan.tagline}</p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[var(--color-text-primary)]">
                    <Check className="h-4 w-4 shrink-0 text-[#FF6A00]" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {plan.popular ? (
                  <ShimmerButton background="#FF6A00" className="w-full justify-center text-sm font-semibold">
                    Choose {plan.name}
                  </ShimmerButton>
                ) : (
                  <button className="w-full rounded-lg border border-[var(--color-border)] py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[#FF6A00] hover:text-[#FF6A00]">
                    Choose {plan.name}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
