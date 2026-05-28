"use client";

import Image from "next/image";
import Link from "next/link";
// lucide v1 dropped Twitter/Linkedin — using inline SVGs

const columns = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Chrome Extension", href: "#" },
    ],
  },
  {
    heading: "Integrations",
    links: [
      { label: "Slack", href: "#" },
      { label: "Notion", href: "#" },
      { label: "HubSpot", href: "#" },
      { label: "Linear", href: "#" },
    ],
  },
  {
    heading: "Use Cases",
    links: [
      { label: "Sales Teams", href: "#" },
      { label: "Product Managers", href: "#" },
      { label: "Financial Advisors", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Contact", href: "mailto:hello@minutz.ai" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[#E5E5E5] py-16 dark:border-[#2A2A2A]">
      <div className="mx-auto max-w-6xl px-6">
        {/* Link grid */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#6B6B6B] transition-colors hover:text-[#000000] dark:text-[#A3A3A3] dark:hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#E5E5E5] pt-8 dark:border-[#2A2A2A] md:flex-row">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image src="/logo-light.png" alt="Minutz" width={90} height={22} style={{ height: "auto" }} className="block dark:hidden" />
            <Image src="/logo-dark.png" alt="Minutz" width={90} height={22} style={{ height: "auto" }} className="hidden dark:block" />
          </Link>

          {/* Copyright */}
          <p className="text-sm text-[#A3A3A3]">
            © 2026 Minutz. Built with Claude Code + OpenAI
          </p>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B6B6B] transition-colors hover:text-[#000000] dark:text-[#A3A3A3] dark:hover:text-white"
              aria-label="Twitter"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B6B6B] transition-colors hover:text-[#000000] dark:text-[#A3A3A3] dark:hover:text-white"
              aria-label="LinkedIn"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
