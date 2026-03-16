import Link from "next/link";
import { BriefcaseBusiness, ClipboardList, LayoutGrid, LogOut, Settings, Shield } from "lucide-react";

import { auth, signOut } from "@/auth";
import type { Role } from "@/lib/auth/permissions";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TopNav } from "./TopNav";
import { ThemeToggle } from "./ThemeToggle";
import { ServiceSwitcher } from "./ServiceSwitcher";
import { getCurrentService } from "@/lib/service-context.server";
import { getServices } from "@/features/admin/services/queries";

export async function Header() {
  const session = await auth();
  const user = session?.user;
  const userInitial = (user?.name?.trim().charAt(0) ?? "U").toUpperCase();
  const role = (user as { role?: Role } | undefined)?.role;
  const [currentService, services] = await Promise.all([
    getCurrentService(),
    getServices(true),
  ]);
  const serviceOptions = services.length > 0
    ? services
    : [{ id: 0, key: "bestside", label: "Bestside Services", is_active: true }];

  const adminLinks =
    role === "admin"
      ? [
          { href: "/admin/users", label: "Users", icon: Shield },
          { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
          { href: "/admin/locations", label: "Locations", icon: Settings },
          { href: "/admin/services", label: "Services", icon: BriefcaseBusiness },
          { href: "/audit", label: "Audit", icon: ClipboardList },
        ]
      : [];

  return (
    <header className="sticky top-0 z-30 w-full">
      <TopNav>
        <ServiceSwitcher currentService={currentService} options={serviceOptions} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 gap-2 rounded-full border border-slate-300/80 bg-white/85 px-2.5 text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700/80"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--logo-primary)] text-[11px] font-semibold text-white dark:bg-[var(--logo-secondary)] dark:text-slate-950">
                {userInitial}
              </span>
              <span className="hidden md:inline">{user?.name ?? "User"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-none backdrop-blur dark:border-white/10 dark:bg-slate-900/95"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1 rounded-lg bg-slate-50/80 p-2 dark:bg-slate-800/60">
                <p className="text-sm font-semibold">{user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email ?? "No email"}</p>
                {role ? (
                  <p className="pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {role}
                  </p>
                ) : null}
              </div>
            </DropdownMenuLabel>
            {adminLinks.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                  {role === "admin" ? "Admin menu" : "Management menu"}
                </DropdownMenuLabel>
                {adminLinks.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex w-full items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-2 py-1 dark:bg-slate-800/60">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                  Theme
                </span>
                <ThemeToggle />
              </div>
            </div>
            <DropdownMenuSeparator />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <DropdownMenuItem asChild>
                <button type="submit" className="flex w-full cursor-pointer items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Deconnexion
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </TopNav>
    </header>
  );
}
