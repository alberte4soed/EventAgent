import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { AssistantProvider } from "@/components/assistant/AssistantProvider";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kalas — plan the wedding, skip the stress",
  description:
    "Kalas is your AI wedding planner: Ava finds real venues, reaches out to vendors and gathers quotes from her own concierge inbox, and designs your invites — you just approve.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-screen flex-col bg-cream font-[family-name:var(--font-inter)] text-ink">
        <AssistantProvider>{children}</AssistantProvider>
      </body>
    </html>
  );
}
