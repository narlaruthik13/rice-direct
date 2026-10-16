"use client";

import { Toaster as Sonner } from "sonner";

/** Toasts in brand colours. */
function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border !border-border !bg-card !text-foreground !shadow-card !font-sans",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}

export { Toaster };
