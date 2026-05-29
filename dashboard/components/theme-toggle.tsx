"use client";

import { Sun } from "lucide-react";

export function ThemeToggle() {
  return (
    <button
      type="button"
      className="text-[#A3A3A3] hover:text-white transition-colors duration-200"
      aria-label="Dark theme enabled"
      title="Dark theme enabled"
    >
      <Sun className="h-5 w-5" />
    </button>
  );
}
