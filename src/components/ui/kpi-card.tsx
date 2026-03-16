import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number;
  color: "green" | "red" | "auto";
  prefix?: string;
  badge?: string;
  footer?: string;
  progress?: number;
  icon?: LucideIcon;
}

const toneStyles = {
  green: {
    card:
      "border-[#104eee1a] bg-[linear-gradient(165deg,#ffffff_0%,#fcfeff_65%,#f8fdff_100%)] dark:border-[#27bdfb1f] dark:bg-[linear-gradient(165deg,#ffffff_0%,#f8fdff_65%,#f4fbff_100%)]",
    value: "bg-gradient-to-b from-slate-900 via-[#104eee] to-[#27bdfb] bg-clip-text text-transparent dark:from-white dark:via-[#56dffe] dark:to-[#27bdfb]",
    iconWrap:
      "border-[#104eee2b] bg-[#104eee10] text-[#104eee] dark:border-[#27bdfb40] dark:bg-[#27bdfb17] dark:text-[#56dffe]",
    progress: "from-[#104eee] via-[#27bdfb] to-[#56dffe]",
    progressTrack: "bg-[#104eee0e] dark:bg-[#27bdfb12]",
    glow: "bg-[#27bdfb]/6 dark:bg-[#56dffe]/6",
    accent: "from-[#104eee]/70 via-[#27bdfb]/50 to-transparent",
    badge:
      "border-[#104eee33] bg-[#104eee14] text-[#104eee] dark:border-[#27bdfb33] dark:bg-[#27bdfb1a] dark:text-[#56dffe]",
    dot: "bg-[#104eee]",
  },
  red: {
    card:
      "border-rose-200/45 bg-[linear-gradient(165deg,#ffffff_0%,#fffafc_58%,#fff6f9_100%)] dark:border-rose-300/30 dark:bg-[linear-gradient(165deg,#ffffff_0%,#fff8fb_58%,#fff3f8_100%)]",
    value: "bg-gradient-to-b from-slate-900 via-rose-700 to-fuchsia-600 bg-clip-text text-transparent dark:from-white dark:via-rose-200 dark:to-fuchsia-300",
    iconWrap:
      "border-rose-200/65 bg-rose-50/70 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-200",
    progress: "from-rose-500 via-fuchsia-500 to-fuchsia-400",
    progressTrack: "bg-rose-500/8 dark:bg-rose-400/10",
    glow: "bg-rose-400/6 dark:bg-rose-300/7",
    accent: "from-rose-400/70 via-fuchsia-200/50 to-transparent",
    badge:
      "border-rose-200/70 bg-rose-50/80 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200",
    dot: "bg-rose-500",
  },
} as const;

export function KpiCard({
  title,
  value,
  color,
  prefix = "",
  badge = "Synthese",
  footer = "Intensite du volume mensuel",
  progress = 0,
  icon: Icon,
}: KpiCardProps) {
  const isPositive = value >= 0;
  const resolvedColor = color === "auto" ? (value >= 0 ? "green" : "red") : color;
  const tone = toneStyles[resolvedColor];
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const formattedValue = value.toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[22px] border p-4 transition-all duration-300 hover:-translate-y-0.5",
        tone.card
      )}
    >
      <div className={cn("absolute -right-12 -top-16 h-32 w-32 rounded-full blur-2xl", tone.glow)} />
      <div className={cn("absolute inset-x-6 top-0 h-px bg-gradient-to-r", tone.accent)} />
      <div className="absolute inset-px rounded-[22px] border border-black/[0.04] dark:border-white/6" />

      <div className="relative flex h-full flex-col justify-between gap-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.17em]",
                tone.badge
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", tone.dot)} />
              {badge}
            </span>
            <p className="text-[14px] font-semibold tracking-[-0.02em] text-foreground/90 dark:text-foreground">
              {title}
            </p>
          </div>

          {Icon ? (
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl border ring-1 ring-black/5 dark:ring-white/10",
                tone.iconWrap
              )}
            >
              <Icon className="size-4" />
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <p
                className={cn(
                  "flex flex-wrap items-end gap-x-1.5 gap-y-1 text-[1.85rem] font-semibold leading-none tracking-[-0.05em] tabular-nums sm:text-[2.2rem]",
                  tone.value
                )}
              >
                {prefix ? <span className="text-lg font-medium text-muted-foreground/80 sm:text-xl">{prefix}</span> : null}
                <span>{formattedValue}</span>
                <span className="pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  MAD
                </span>
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/90">
                Monthly closing
              </p>
            </div>
            <span
              className={cn(
                "hidden items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold md:inline-flex",
                isPositive
                  ? "border-[#104eee33] bg-[#104eee14] text-[#104eee] dark:border-[#27bdfb33] dark:bg-[#27bdfb1a] dark:text-[#56dffe]"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
              )}
            >
              {isPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {isPositive ? "Positif" : "Sous pression"}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{footer}</span>
              <span className="font-semibold tabular-nums text-foreground/80">{Math.round(clampedProgress)}%</span>
            </div>
            <div className={cn("h-2 overflow-hidden rounded-full", tone.progressTrack)}>
              <div
                className={cn("h-full rounded-full bg-gradient-to-r", tone.progress)}
                style={{ width: `${clampedProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
