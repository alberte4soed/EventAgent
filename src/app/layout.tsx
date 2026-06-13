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
  title: "Kalas — plan the wedding, skip the stress",
  description:
    "Kalas is your wedding-planning agent: it finds venues, contacts them for quotes, designs invites, and tracks RSVPs — all from your own Gmail.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-screen flex-col bg-cream font-[family-name:var(--font-inter)] text-ink">
        {children}
      </body>
    </html>
  );
}
