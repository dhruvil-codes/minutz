"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[#E5E5E5] bg-white/95 backdrop-blur-sm dark:border-[#2A2A2A] dark:bg-[#000000]/95">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex shrink-0 items-center">
          <Image src="/logo-light.png" alt="Minutz" width={140} height={36} className="block dark:hidden" priority loading="eager" style={{ height: "auto" }} />
          <Image src="/logo-dark.png" alt="Minutz" width={140} height={36} className="hidden dark:block" priority loading="eager" style={{ height: "auto" }} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-[#6B6B6B] transition-colors hover:text-[#000000] dark:hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm font-medium text-[#6B6B6B] transition-colors hover:text-[#000000] dark:text-[#A3A3A3] dark:hover:text-white">
            Sign In
          </Link>
          <Link href="/login" className="rounded-lg bg-[#FF6A00] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#E55E00]">
            Get Started
          </Link>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<button className="md:hidden p-1 text-[#6B6B6B]"><Menu className="h-5 w-5" /></button>} />
          <SheetContent side="right" className="w-72 bg-white dark:bg-[#000000]">
            <div className="flex flex-col gap-6 pt-8">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-base font-medium text-[#000000] dark:text-white">
                  {l.label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 border-t border-[#E5E5E5] pt-6 dark:border-[#2A2A2A]">
                <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-[#6B6B6B]">Sign In</Link>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg bg-[#FF6A00] px-4 py-2.5 text-center text-sm font-semibold text-white">Get Started</Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
