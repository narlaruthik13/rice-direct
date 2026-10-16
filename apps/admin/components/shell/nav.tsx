"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Factory,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  ShoppingBag,
  Sprout,
  Truck,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/catalogue", label: "Batches & Products", icon: Boxes },
  { href: "/farmers", label: "Farmers", icon: Sprout },
  { href: "/partners", label: "Partners", icon: Factory },
  { href: "/delivery", label: "Delivery", icon: Truck },
  { href: "/payouts", label: "Payouts", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-soil/80 hover:bg-secondary hover:text-soil",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
