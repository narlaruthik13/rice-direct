import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This admin page doesn&apos;t exist.</p>
        <Button asChild className="mt-6">
          <Link href="/">Go to the dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
