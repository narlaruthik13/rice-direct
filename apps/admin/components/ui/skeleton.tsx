import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden="true" className={cn("rounded-md bg-secondary motion-safe:animate-pulse", className)} {...props} />;
}

export { Skeleton };
