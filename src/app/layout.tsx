import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "TradeVault - Manual Backtesting Platform",
  description: "High-performance manual backtesting trading journal and analytics dashboard for currency traders.",
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-[#030303] text-zinc-100 font-sans flex flex-col">
        {children}
      </body>
    </html>
  );
}
