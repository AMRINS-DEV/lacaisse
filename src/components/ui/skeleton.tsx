import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type SkeletonProps = ComponentProps<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[calc(var(--radius)+2px)] bg-slate-200/80",
        "before:absolute before:inset-0 before:content-[''] before:animate-[skeleton-shimmer_1.8s_ease-in-out_infinite]",
        "before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.75),transparent)]",
        "dark:bg-slate-800/80 dark:before:bg-[linear-gradient(90deg,transparent,rgba(148,163,184,0.22),transparent)]",
        className
      )}
      {...props}
    />
  );
}
