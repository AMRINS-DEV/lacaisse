import { getUnreadAlertCount } from "@/features/alerts/queries";
import { Bell } from "lucide-react";
import Link from "next/link";

export async function AlertBadge() {
  let count = 0;
  try {
    count = await getUnreadAlertCount();
  } catch {
    // DB not connected yet
  }

  return (
    <Link href="/admin/alerts" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--logo-variation)] text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
