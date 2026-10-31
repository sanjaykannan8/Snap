import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import { SoundEffects } from "@/components/ui/sound";
import { SessionProvider } from "@/components/auth/session-provider";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Snap: the skill router for AI agents",
  description:
    "A hosted skill library for AI agents, served through a single MCP tool. Store every skill in one dashboard; your agent gets only the one it needs.",
  icons: { icon: "/snap-logo.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="flex min-h-full flex-col bg-background text-foreground">
        <SessionProvider><SoundEffects>{children}</SoundEffects></SessionProvider>
      </body>
    </html>
  );
}
