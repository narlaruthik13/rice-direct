import Link from "next/link";
import { LogOut } from "lucide-react";
import type { AdminProfile } from "@kisa/shared";
import { Logo } from "@kisa/ui/logo-static";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./nav";

const ROLE_LABEL: Record<AdminProfile["role"], string> = { ADMIN: "Admin", STAFF: "Staff" };

/** Sidebar (drawer on mobile) + top bar with the signed-in admin and logout. */
export function Shell({ admin, children }: { admin: AdminProfile; children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-card lg:flex">
        <Link href="/" className="flex h-16 items-center gap-2 border-b px-5" aria-label="Kisa admin dashboard">
          <Logo size={26} />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-husk">Admin</span>
        </Link>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
        <MobileNav />
        <Link href="/" className="lg:hidden" aria-label="Kisa admin dashboard">
          <Logo size={24} />
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight" data-testid="admin-name">
              {admin.name}
            </p>
            <p className="text-xs text-muted-foreground">{admin.email}</p>
          </div>
          <Badge variant="secondary" data-testid="admin-role">
            {ROLE_LABEL[admin.role]}
          </Badge>
          <form action="/api/auth/logout" method="post">
            <Button type="submit" variant="outline" size="sm">
              <LogOut aria-hidden="true" />
              <span>Log out</span>
            </Button>
          </form>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
