"use client";

import { Marquee } from "@/components/magicui/marquee";

const tools = [
  {
    name: "Otter.ai",
    icon: (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1A73E8] text-[10px] font-bold text-white">O</span>
    ),
  },
  {
    name: "Fireflies",
    icon: (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7C3AED] text-[10px] font-bold text-white">F</span>
    ),
  },
  {
    name: "Fathom",
    icon: (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0EA5E9] text-[10px] font-bold text-white">F</span>
    ),
  },
  {
    name: "Zoom",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#2D8CFF"/>
        <path d="M4 8.5C4 7.67 4.67 7 5.5 7H13.5C14.33 7 15 7.67 15 8.5V15.5C15 16.33 14.33 17 13.5 17H5.5C4.67 17 4 16.33 4 15.5V8.5Z" fill="white"/>
        <path d="M16 10.2L20 8V16L16 13.8V10.2Z" fill="white"/>
      </svg>
    ),
  },
  {
    name: "Google Meet",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#00897B"/>
        <path d="M6 9.5C6 8.67 6.67 8 7.5 8H13.5C14.33 8 15 8.67 15 9.5V14.5C15 15.33 14.33 16 13.5 16H7.5C6.67 16 6 15.33 6 14.5V9.5Z" fill="white"/>
        <path d="M16 10.5L19 9V15L16 13.5V10.5Z" fill="white"/>
      </svg>
    ),
  },
  {
    name: "Microsoft Teams",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#4B53BC"/>
        <path d="M13.5 7.5C13.5 8.33 12.83 9 12 9C11.17 9 10.5 8.33 10.5 7.5C10.5 6.67 11.17 6 12 6C12.83 6 13.5 6.67 13.5 7.5Z" fill="white"/>
        <path d="M15 9.5H9C8.45 9.5 8 9.95 8 10.5V15C8 15.55 8.45 16 9 16H15C15.55 16 16 15.55 16 15V10.5C16 9.95 15.55 9.5 15 9.5Z" fill="white" fillOpacity="0.9"/>
        <path d="M16.5 8.5C16.5 9.05 16.05 9.5 15.5 9.5C14.95 9.5 14.5 9.05 14.5 8.5C14.5 7.95 14.95 7.5 15.5 7.5C16.05 7.5 16.5 7.95 16.5 8.5Z" fill="white" fillOpacity="0.8"/>
        <path d="M17 10H15.5V14C15.5 14.55 15.05 15 14.5 15H10V15.5C10 16.05 10.45 16.5 11 16.5H17C17.55 16.5 18 16.05 18 15.5V11C18 10.45 17.55 10 17 10Z" fill="white" fillOpacity="0.7"/>
      </svg>
    ),
  },
];

export function SocialProof() {
  return (
    <section className="border-y border-[#E5E5E5] py-10 dark:border-[#2A2A2A]">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#A3A3A3]">
        For teams switching from
      </p>
      <div className="relative overflow-hidden">
        <Marquee pauseOnHover className="[--duration:30s] [--gap:3rem]" repeat={3}>
          {tools.map((t) => (
            <span
              key={t.name}
              className="flex items-center gap-2 px-4 text-sm font-medium text-[#6B6B6B] opacity-60 transition-opacity duration-200 hover:opacity-100 dark:text-[#A3A3A3]"
            >
              {t.icon}
              {t.name}
            </span>
          ))}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 dark:from-[#000000]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 dark:from-[#000000]" />
      </div>
    </section>
  );
}
