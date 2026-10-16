"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@kisa/ui/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "./nav";

/** On small screens the sidebar becomes a drawer. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="border-b px-5 py-4">
          <SheetTitle asChild>
            <div>
              <Logo size={26} />
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">Admin navigation</SheetDescription>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
