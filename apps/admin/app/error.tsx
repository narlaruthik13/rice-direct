"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Catches failures in the panel layout itself (e.g. the API is down when loading the admin). */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">The admin couldn&apos;t load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong while talking to the Kisa server. Please try again.</p>
        <Button className="mt-6" variant="outline" onClick={reset}>
          <RotateCw aria-hidden="true" />
          Try again
        </Button>
      </div>
    </main>
  );
}
