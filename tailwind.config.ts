import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Earthy palette: field green, paddy gold, husk brown, rice off-white.
      colors: {
        field: {
          light: "#4E6B3F",
          DEFAULT: "#2F4A2A",
          dark: "#1E321B",
        },
        paddy: {
          light: "#EBCB6E",
          DEFAULT: "#D4A62A",
          dark: "#A67E12",
        },
        husk: {
          light: "#B08560",
          DEFAULT: "#8B5E3C",
          dark: "#5C3B22",
        },
        rice: {
          DEFAULT: "#FAF6EC",
          dim: "#F1E9D6",
        },
        soil: "#2E2219", // body text
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(46,34,25,0.06), 0 8px 24px -12px rgba(46,34,25,0.18)",
      },
      maxWidth: {
        site: "72rem",
      },
    },
  },
  plugins: [],
};
export default config;
