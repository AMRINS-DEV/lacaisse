"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SERVICE_COOKIE_NAME,
  type ServiceKey,
} from "@/lib/service-context";
import type { ServiceOption } from "@/features/admin/services/queries";

export function ServiceSwitcher({
  currentService,
  options,
}: {
  currentService: ServiceKey;
  options: ServiceOption[];
}) {
  const router = useRouter();

  function setService(value: string) {
    const next = options.some((option) => option.key === value)
      ? (value as ServiceKey)
      : currentService;
    document.cookie = `${SERVICE_COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <Select value={currentService} onValueChange={setService}>
      <SelectTrigger className="h-10 w-[170px] rounded-xl border-slate-300/80 bg-white/85 text-xs dark:border-white/15 dark:bg-slate-800/80">
        <SelectValue placeholder="Service" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.key} value={option.key}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

