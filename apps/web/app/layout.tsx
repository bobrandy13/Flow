import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Oswald } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/nav/TopNav";
import { ClientProviders } from "@/components/layout/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Industrial display face for blueprint headings (uppercase + tracked).
const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

// Monospace for metric callouts (latency, success %, sheet numbers).
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flow — learn system design by building it",
  description: "A level-based game that teaches system design hands-on.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${oswald.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TopNav />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
