import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TradeVault - Trading Journal",
    short_name: "TradeVault",
    description:
      "Private, local-first trading journal and backtesting analytics.",
    start_url: "/",
    display: "standalone",
    background_color: "#050a08",
    theme_color: "#050a08",
    icons: [
      { src: "/tradevault-mark.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
