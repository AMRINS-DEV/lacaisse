export interface Recette {
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

export interface RecetteFilters {
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

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface RecetteLocationMonthTotal {
  location_id: number;
  location_code: string;
  location_name: string;
  total: number;
}

export interface RecetteOverviewStats {
  all_time_total: number;
  current_month_total: number;
  current_month_count: number;
  current_month_by_location: RecetteLocationMonthTotal[];
}
