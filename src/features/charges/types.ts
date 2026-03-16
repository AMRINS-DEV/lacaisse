import type { PaginatedResult } from "@/features/recettes/types";
export type { PaginatedResult };

export interface Charge {
  id: number;
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  location_id: number;
  location_code: string;
  location_name: string;
  date: string;
  created_at: string;
  attachment_id: number | null;
  attachment_name: string | null;
  attachment_path: string | null;
  attachment_mime_type: string | null;
}

export interface ChargeFilters {
  location_id?: number;
  category?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
  no_pagination?: boolean;
}

export interface ChargeLocationMonthTotal {
  location_id: number;
  location_code: string;
  location_name: string;
  total: number;
}

export interface ChargeOverviewStats {
  all_time_total: number;
  current_month_total: number;
  current_month_count: number;
  current_month_by_location: ChargeLocationMonthTotal[];
}
