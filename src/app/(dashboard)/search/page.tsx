import { searchTransactions } from "@/features/search/queries";
import type { SearchFilters } from "@/features/search/queries";
import { getLocations } from "@/features/admin/locations/queries";
import { getCategories } from "@/features/admin/categories/queries";
import { getPaymentMethods } from "@/features/admin/payment-methods/queries";
import { SearchClient } from "./SearchClient";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const getParam = (key: string) => {
    const value = params[key];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  const initialFilters: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (typeof firstValue === "string" && firstValue.length > 0) {
      initialFilters[key] = firstValue;
    }
  }

  const [result, locations, categories, paymentMethods] = await Promise.all([
    searchTransactions({
      q: getParam("q") || undefined,
      type: getParam("type") || undefined,
      location_id: getParam("location_id") ? parseInt(getParam("location_id") as string) : undefined,
      category: getParam("category") || undefined,
      payment_method: getParam("payment_method") || undefined,
      date_from: getParam("date_from") || undefined,
      date_to: getParam("date_to") || undefined,
      amount_min: getParam("amount_min")
        ? parseFloat(getParam("amount_min") as string)
        : getParam("price_min")
          ? parseFloat(getParam("price_min") as string)
          : undefined,
      amount_max: getParam("amount_max")
        ? parseFloat(getParam("amount_max") as string)
        : getParam("price_max")
          ? parseFloat(getParam("price_max") as string)
          : undefined,
      match_mode: (getParam("match_mode") as SearchFilters["match_mode"]) || "broad",
      sort: (getParam("sort") as SearchFilters["sort"]) || "date_desc",
      page: getParam("page") ? parseInt(getParam("page") as string) : 1,
    }),
    getLocations(),
    getCategories(),
    getPaymentMethods(),
  ]);

  return (
    <SearchClient
      result={result}
      locations={locations}
      categories={categories}
      paymentMethods={paymentMethods}
      initialFilters={initialFilters}
    />
  );
}
