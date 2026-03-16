export interface Transaction {
  id: number;
  from_location_id: number;
  from_location_name: string;
  to_location_id: number;
  to_location_name: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface TransactionFilters {
  month?: number;
  year?: number;
  from_location_id?: number;
  to_location_id?: number;
}
