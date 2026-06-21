import type { CSSProperties } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "OpenCore — Local-First AI Workspace",
  description:
    "OpenCore is a local-first AI workspace with chat, voice, file uploads, agent mode, custom model routing, and OpenAI-compatible gateway support. Your data, your routes, your machine.",
  keywords: [
    "OpenCore",
    "local AI assistant",
    "privacy AI",
    "voice assistant",
    "local-first AI",
  ],
  authors: [{ name: "OpenCore" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "OpenCore — Local-First AI Workspace",
    description:
      "A privacy-first AI workspace with chat, voice, files, agent mode, and a local/OpenAI-compatible model gateway.",
    siteName: "OpenCore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenCore — Local-First AI Workspace",
    description:
      "A privacy-first AI workspace with chat, voice, files, agent mode, and configurable model routing.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className="antialiased bg-background text-foreground"
        style={{
          "--font-geist-sans": "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          "--font-geist-mono": "JetBrains Mono, SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
        } as CSSProperties}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
