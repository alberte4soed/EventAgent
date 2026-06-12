import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kalas — celebrate more, coordinate less",
  description:
    "Kalas is your event-planning agent: it finds venues, you swipe, and it collects quotes over email from your own Gmail.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-screen flex-col bg-[#f4f1e8] font-[family-name:var(--font-inter)] text-[#3d2b23]">
        {children}
      </body>
    </html>
  );
}
