import * as React from "react";
import { cn } from "@/lib/utils";

const Card = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("rounded-lg border bg-card text-card-foreground shadow-card", className)} {...props} />
);

const CardHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />
);

const CardTitle = ({ className, ...props }: React.ComponentProps<"h3">) => (
  <h3 className={cn("font-display text-lg font-semibold leading-tight", className)} {...props} />
);

const CardDescription = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);

const CardContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("p-5 pt-0", className)} {...props} />
);

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
