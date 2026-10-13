"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { selectCartCount, useCartStore } from "@/store/cart";
import { GrainMark } from "@/components/ui/GrainMark";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#farmers", label: "Our farmers" },
];

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useCartStore(selectCartCount);

  // Load the saved cart from localStorage only after mount (store uses skipHydration).
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  // Close the mobile menu after navigating.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => !href.includes("#") && pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-husk/15 bg-rice/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-site items-center justify-between px-4 sm:px-6" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 text-field">
          <GrainMark />
          <span className="font-display text-xl font-semibold tracking-tight">Vari Direct</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-field ${
                  isActive(link.href) ? "text-field underline decoration-paddy decoration-2 underline-offset-8" : "text-soil/75"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/login" className="hidden rounded-full px-3 py-2 text-sm font-medium text-soil/75 hover:text-field sm:block">
            Login
          </Link>

          {/* data-cart-icon: target for the "grains fly into cart" animation later. */}
          <Link
            href="/cart"
            data-cart-icon
            className="relative rounded-full p-2 text-field transition-colors hover:bg-rice-dim"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <CartIcon />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-paddy px-1 text-[11px] font-bold text-soil"
                >
                  {count > 99 ? "99+" : count}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <button
            type="button"
            className="rounded-full p-2 text-field hover:bg-rice-dim md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-husk/15 md:hidden"
          >
            <ul className="space-y-1 px-4 py-3">
              {[...links, { href: "/login", label: "Login" }].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2.5 font-medium text-soil/85 hover:bg-rice-dim hover:text-field"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
