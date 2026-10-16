import type { Config } from "tailwindcss";
import kisaPreset from "@kisa/config/tailwind-preset";

const config: Config = {
  presets: [kisaPreset],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // Hero layouts. "wide": bag + CTA side by side (desktop, or any landscape screen that is
        // clearly wider than tall; keep in sync with pourSideLayout in components/hero/harvest.ts).
        wide: { raw: "(min-width: 1024px), (min-width: 640px) and (min-aspect-ratio: 8/5)" },
        // "short": landscape phones; captions and the CTA card go compact.
        short: { raw: "(max-height: 500px)" },
      },
    },
  },
  plugins: [],
};
export default config;
