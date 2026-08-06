import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

export const metadata: Metadata = {
  metadataBase: new URL("https://github.com/MrBoodj011/TradeVault"),
  title: {
    default: "TradeVault - Local-first trading journal",
    template: "%s | TradeVault",
  },
  description:
    "A private, local-first trading journal and manual backtesting workspace for evidence-driven traders.",
  applicationName: "TradeVault",
  authors: [{ name: "MrBoodj011", url: "https://github.com/MrBoodj011" }],
  keywords: [
    "trading journal",
    "manual backtesting",
    "risk management",
    "local-first",
  ],
  icons: { icon: "/tradevault-mark.svg", apple: "/tradevault-mark.svg" },
  openGraph: {
    title: "TradeVault",
    description: "Turn every execution into evidence.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
