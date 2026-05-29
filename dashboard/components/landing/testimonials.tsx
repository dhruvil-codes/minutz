"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Marquee } from "@/components/ui/marquee";

const testimonials = [
  {
    logo: "TAILUS",
    quote:
      "Minutz turned our meeting follow-up from a manual chore into a clean, reliable workflow. The summaries land fast, the action items are sharp, and the interface feels like it belongs in our stack.",
    name: "Shekinah Tshiokufila",
    role: "Software Engineer",
    initials: "ST",
    avatar: "https://tailus.io/images/reviews/shekinah.webp",
  },
  {
    logo: "MINUTZ",
    quote:
      "We finally have a meeting tool that stays invisible during the call and still gives us the context we need after. It is simple to use and surprisingly polished.",
    name: "Jonathan Yombo",
    role: "Product Lead",
    initials: "JY",
    avatar: "https://tailus.io/images/reviews/jonathan.webp",
  },
  {
    logo: "LOVED",
    quote:
      "The output is crisp, the flow is easy, and the product feels designed by people who actually sit through meetings. That matters more than it sounds like it should.",
    name: "Yucel Faruksahan",
    role: "Creator, Tailkits",
    initials: "YF",
    avatar: "https://tailus.io/images/reviews/yucel.webp",
  },
  {
    logo: "BUILDERS",
    quote:
      "Minutz keeps the whole post-meeting process tight. The app is fast, the hierarchy is clear, and it does exactly what a serious team tool should do.",
    name: "Rodrigo Aguilar",
    role: "Creator, TailwindAwesome",
    initials: "RA",
    avatar: "https://tailus.io/images/reviews/rodrigo.webp",
  },
] as const;

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[number];
}) {
  return (
    <Card className="h-full w-[320px] border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="inline-flex w-fit items-center rounded-full border border-[var(--color-border)] bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF6A00]">
          {testimonial.logo}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
        <blockquote className="flex h-full flex-col justify-between gap-6">
          <p className="text-base font-medium leading-relaxed text-[var(--color-text-primary)]">
            {testimonial.quote}
          </p>

          <div className="grid grid-cols-[auto_1fr] items-center gap-3">
            <Avatar className="size-12 border border-white/10">
              <AvatarImage
                src={testimonial.avatar}
                alt={testimonial.name}
                loading="lazy"
              />
              <AvatarFallback>{testimonial.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <cite className="block text-sm font-medium not-italic text-[var(--color-text-primary)]">
                {testimonial.name}
              </cite>
              <span className="block text-sm text-[var(--color-text-secondary)]">{testimonial.role}</span>
            </div>
          </div>
        </blockquote>
      </CardContent>
    </Card>
  );
}

export default function Testimonials() {
  return (
    <section className="bg-background py-16 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
            Trusted by teams
          </div>
          <h2 className="mt-6 text-4xl font-medium leading-[1.05] tracking-tight text-[var(--color-text-primary)] lg:text-5xl">
            Built by makers, loved by developers.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg">
            Minutz is designed to feel quiet in the room and decisive afterward, which is usually the hard part.
          </p>
        </div>

        <div className="relative mt-12 overflow-hidden">
          <Marquee pauseOnHover className="py-2" repeat={2}>
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.name} testimonial={testimonial} />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
        </div>
      </div>
    </section>
  );
}
