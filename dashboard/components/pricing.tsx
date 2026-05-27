"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";

const tiers = [
    {
        name: "Free",
        price: "$0",
        period: "/month",
        description: "Get started at no cost",
        features: ["5 meetings/month", "Chrome Extension", "Basic summary"],
        cta: "Start free",
        popular: false,
    },
    {
        name: "Pro",
        price: "$19",
        period: "/month",
        description: "For individuals who run on meetings",
        features: ["Unlimited meetings", "All niche modes", "Slack + Notion sync", "Priority processing"],
        cta: "Get Pro",
        popular: true,
    },
    {
        name: "Team",
        price: "$12",
        period: "/seat/month",
        description: "For teams that move fast",
        features: ["Everything in Pro", "Team analytics", "HubSpot sync", "Admin controls"],
        cta: "Talk to us",
        popular: false,
    },
];

const Pricing = () => {
    const isMobile = useMediaQuery("(max-width: 768px)");
    return (
        <motion.div
            style={{
                backgroundImage: isMobile
                    ? "url('/images/templates/axis/pricing-mobile.svg')"
                    : "url('/images/templates/axis/pricing.svg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
            className="rounded-4xl px-6 pt-16 pb-8 md:px-12 md:py-20 max-w-7xl mx-auto w-full"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <div className="mx-auto max-w-4xl">
                <div className="mb-12 flex flex-col items-center text-center">
                    <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
                        Simple pricing, no surprises
                    </h2>
                    <p className="mt-4 text-sm text-white/70 sm:text-base">
                        Start free — no credit card required
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {tiers.map((tier) => (
                        <Card key={tier.name} className={`relative overflow-hidden rounded-2xl border-0 bg-background/85 p-6 shadow-xl flex flex-col gap-5 ${tier.popular ? "ring-2 ring-primary" : ""}`}>
                            {tier.popular && (
                                <span className="absolute top-3 right-3 text-xs font-semibold bg-primary text-primary-foreground px-2.5 py-1 rounded-full">
                                    Most popular
                                </span>
                            )}
                            <div>
                                <h3 className="text-lg font-medium text-foreground">{tier.name}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
                                <p className="mt-3 text-3xl font-medium text-foreground">
                                    {tier.price}<span className="text-base font-normal text-muted-foreground">{tier.period}</span>
                                </p>
                            </div>
                            <ul className="flex flex-col gap-2.5 flex-1">
                                {tier.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-sm text-foreground font-medium">
                                        <Check className="h-4 w-4 text-foreground shrink-0" strokeWidth={2} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Button className="w-full rounded-full" variant={tier.popular ? "default" : "outline"}>
                                {tier.cta}
                            </Button>
                        </Card>
                    ))}
                </div>

                <div className="mt-8 border-t border-white/20 pt-6">
                    <p className="text-sm leading-relaxed text-white/60 text-center">
                        Minutz is designed for meeting-heavy teams. From solo AEs to enterprise product orgs.
                    </p>
                    <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                        <Image src="/logo/templates/axis/logoipsum-1.svg" alt="Company logo" width={80} height={24} className="h-6 md:h-7 lg:h-10 w-auto opacity-80 dark:invert" />
                        <Image src="/logo/templates/axis/logoipsum-2.svg" alt="Company logo" width={80} height={24} className="h-6 md:h-7 lg:h-10 w-auto opacity-80 dark:invert" />
                        <Image src="/logo/templates/axis/shopify-2.svg" alt="Shopify" width={80} height={24} className="h-6 md:h-7 lg:h-10 w-auto opacity-80 dark:invert" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Pricing;
