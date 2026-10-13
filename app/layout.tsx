import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { MotionProvider } from "@/components/ui/MotionProvider";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Kisa — Farmer-owned rice & onions",
    template: "%s | Kisa",
  },
  description:
    "Kisa — farmer-owned food. Buy rice and onions directly from the farmers who grew them, with no middlemen. Every pack is traceable to the field, with a transparent price breakdown.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-paddy focus:px-4 focus:py-2 focus:font-semibold"
        >
          Skip to content
        </a>
        <MotionProvider>
          <Navbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
