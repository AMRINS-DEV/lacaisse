"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  BarChart3,
  Search,
  Settings,
  Bell,
  ClipboardList,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/recettes", icon: TrendingUp, label: "Recettes" },
  { href: "/charges", icon: TrendingDown, label: "Charges" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/reports", icon: BarChart3, label: "Rapports" },
  { href: "/search", icon: Search, label: "Recherche" },
];

const adminItems = [
  { href: "/admin", icon: Settings, label: "Admin" },
  { href: "/alerts", icon: Bell, label: "Alertes" },
  { href: "/audit", icon: ClipboardList, label: "Audit" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col w-60 min-h-screen border-r border-border bg-card">
      {/* Logo */}
      <div className="h-14 flex items-center px-6 border-b border-border">
        <span className="text-lg font-bold text-primary">💰 Caisse</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}

        <div className="pt-4 mt-4 border-t border-border space-y-1">
          {adminItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
