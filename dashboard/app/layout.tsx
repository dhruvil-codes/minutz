import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "./globals.css";
import { Providers } from "@/components/providers";

const fontVariables = { "--font-inter": '"Inter", system-ui, sans-serif' } as CSSProperties;

export const metadata: Metadata = {
  title: "Minutz — AI Meeting Intelligence",
  description: "Invisible AI meeting intelligence. 60 seconds to clarity.",
};

export const viewport: Viewport = {
  themeColor: "#FF6A00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      style={fontVariables}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
