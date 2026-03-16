"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  LayoutDashboard,
  Menu,
  Search,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getAppAssetUrl } from "@/lib/storage/asset-url";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/recettes", icon: TrendingUp, label: "Recettes" },
  { href: "/charges", icon: TrendingDown, label: "Charges" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/reports", icon: BarChart3, label: "Rapports" },
];

type TopNavProps = {
  children: React.ReactNode;
};

type GlobalSearchTransaction = {
  id: number;
  type: "income" | "expense";
  description: string;
  amount: number;
  category: string;
  location_name: string;
  date: string;
};

type GlobalSearchCategory = {
  id: number;
  name: string;
  type: "income" | "expense";
};

type GlobalSearchLocation = {
  id: number;
  name: string;
  code: string | null;
};

type GlobalSearchGroups = {
  recettes: GlobalSearchTransaction[];
  charges: GlobalSearchTransaction[];
  categories: GlobalSearchCategory[];
  locations: GlobalSearchLocation[];
};

const EMPTY_GROUPS: GlobalSearchGroups = {
  recettes: [],
  charges: [],
  categories: [],
  locations: [],
};

export function TopNav({ children }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const [searchValue, setSearchValue] = useState(currentQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<GlobalSearchGroups>(EMPTY_GROUPS);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    setSearchValue(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  useEffect(() => {
    const query = searchValue.trim();

    if (query.length < 2) {
      setGroups(EMPTY_GROUPS);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/search/global?q=${encodeURIComponent(query)}`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) throw new Error("search_failed");
        const data = (await response.json()) as { groups?: GlobalSearchGroups };
        setGroups(data.groups ?? EMPTY_GROUPS);
      } catch {
        if (!controller.signal.aborted) {
          setGroups(EMPTY_GROUPS);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchValue]);

  const hasResults = useMemo(() => {
    return (
      groups.recettes.length > 0 ||
      groups.charges.length > 0 ||
      groups.categories.length > 0 ||
      groups.locations.length > 0
    );
  }, [groups]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    const trimmedQuery = searchValue.trim();

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    setIsOpen(false);
    router.push(params.size > 0 ? `/search?${params.toString()}` : "/search");
  };

  const resultPanelVisible = isOpen && searchValue.trim().length >= 2;

  return (
    <div className="relative w-full overflow-visible rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,78,238,0.20),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(39,189,251,0.12),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(39,189,251,0.22),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_42%)]" />
      <div className="relative flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 rounded-xl border-slate-300/70 bg-white/80 lg:hidden dark:border-white/15 dark:bg-slate-800/70"
                aria-label="Open navigation menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader className="border-b border-border px-5 py-5 text-left">
                <SheetTitle className="text-left">
                  <Link href="/" className="flex items-center gap-3">
                    <BrandMark />
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-[var(--logo-primary)] text-white dark:bg-[var(--logo-secondary)] dark:text-slate-950"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
          >
            <BrandMark />
          </Link>

          <nav className="ml-3 hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-[var(--logo-primary)] text-white dark:bg-[var(--logo-secondary)] dark:text-slate-950"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <form
          onSubmit={handleSearch}
          className="order-3 w-full md:order-2 md:max-w-md md:flex-1"
        >
          <label htmlFor="top-nav-search" className="sr-only">
            Search
          </label>
          <div ref={wrapperRef} className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              id="top-nav-search"
              name="q"
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                if (searchValue.trim().length >= 2) {
                  setIsOpen(true);
                }
              }}
              placeholder="Search transactions, descriptions, categories..."
              className="h-10 rounded-full border-slate-300/80 bg-white/85 pl-11 pr-14 text-sm shadow-none focus-visible:ring-[var(--logo-secondary)] dark:border-white/15 dark:bg-slate-800/80"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-300/80 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:border-white/15 dark:bg-slate-700/80 dark:text-slate-300">
              Enter
            </span>

            {resultPanelVisible ? (
              <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
                <div className="max-h-[430px] overflow-y-auto p-2">
                  {isLoading ? (
                    <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                      Recherche...
                    </div>
                  ) : !hasResults ? (
                    <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                      Aucun resultat pour &quot;{searchValue.trim()}&quot;.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <SearchSection
                        title="Recettes"
                        icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                        items={groups.recettes.map((item) => (
                          <Link
                            key={`r-${item.id}`}
                            href={buildTransactionSearchHref(item)}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-sm transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-slate-700 dark:text-slate-200">
                                {item.description || "(Sans description)"}
                              </span>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                {formatDate(item.date)}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                              {formatAmount(item.amount)}
                            </span>
                          </Link>
                        ))}
                      />

                      <SearchSection
                        title="Charges"
                        icon={<TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />}
                        items={groups.charges.map((item) => (
                          <Link
                            key={`c-${item.id}`}
                            href={buildTransactionSearchHref(item)}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-sm transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-slate-700 dark:text-slate-200">
                                {item.description || "(Sans description)"}
                              </span>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                {formatDate(item.date)}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-semibold text-rose-700 dark:text-rose-300">
                              {formatAmount(item.amount)}
                            </span>
                          </Link>
                        ))}
                      />

                      <SearchSection
                        title="Categories"
                        icon={<Tag className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />}
                        items={groups.categories.map((item) => (
                          <Link
                            key={`cat-${item.id}`}
                            href={`/search?q=${encodeURIComponent(item.name)}&category=${encodeURIComponent(item.name)}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-sm transition hover:bg-sky-50 dark:hover:bg-sky-500/10"
                          >
                            <span className="truncate text-slate-700 dark:text-slate-200">{item.name}</span>
                            <span className="shrink-0 rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
                              {item.type === "income" ? "Recette" : "Charge"}
                            </span>
                          </Link>
                        ))}
                      />

                      <SearchSection
                        title="Caisses"
                        icon={<Building2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />}
                        items={groups.locations.map((item) => (
                          <Link
                            key={`loc-${item.id}`}
                            href={`/search?q=${encodeURIComponent(item.name)}&location_id=${item.id}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-sm transition hover:bg-violet-50 dark:hover:bg-violet-500/10"
                          >
                            <span className="truncate text-slate-700 dark:text-slate-200">{item.name}</span>
                            <span className="shrink-0 text-xs font-semibold text-violet-700 dark:text-violet-300">
                              {item.code || `C${item.id}`}
                            </span>
                          </Link>
                        ))}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </form>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
          {children}
        </div>
      </div>
    </div>
  );
}

function BrandMark() {
  const logoSrc = getAppAssetUrl("logo_caisse.svg");

  return (
    <span className="flex h-10 shrink-0 items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt="Caisse logo"
        width={132}
        height={40}
        className="h-10 w-auto object-contain"
      />
    </span>
  );
}

function SearchSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: React.ReactNode[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200/70 bg-white/70 p-1.5 dark:border-white/10 dark:bg-slate-800/40">
      <div className="mb-1 flex items-center gap-1.5 px-2 py-1">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {title}
        </p>
      </div>
      <div className="space-y-0.5">{items}</div>
    </section>
  );
}

function formatAmount(value: number) {
  return `${Number(value).toLocaleString("fr-MA", {
    maximumFractionDigits: 0,
  })} DH`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildTransactionSearchHref(item: GlobalSearchTransaction) {
  const params = new URLSearchParams();
  const parts = parseDateParts(item.date);
  const searchValue = item.description.trim();

  if (searchValue) {
    params.set("search", searchValue);
  }

  if (parts) {
    params.set("filter_month", String(parts.month));
    params.set("filter_year", String(parts.year));
    params.set("filter_day", "all");
    params.set("date_from", `${parts.year}-${String(parts.month).padStart(2, "0")}-01`);
    params.set("date_to", `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(getDaysInMonth(parts.year, parts.month)).padStart(2, "0")}`);
  }

  params.set("highlight_id", String(item.id));

  const basePath = item.type === "income" ? "/recettes" : "/charges";
  return `${basePath}?${params.toString()}`;
}

function parseDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  if (month < 1 || month > 12) {
    return null;
  }

  const maxDay = getDaysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    return null;
  }

  return { year, month, day };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
