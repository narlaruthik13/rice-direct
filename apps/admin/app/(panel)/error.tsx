"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown when a panel page fails to load (e.g. the API is down). Details stay in the server log. */
export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-lg border bg-card px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">This page couldn&apos;t load</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Something went wrong while talking to the Kisa server. Please try again.
      </p>
      <Button className="mt-6" variant="outline" onClick={reset}>
        <RotateCw aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}
