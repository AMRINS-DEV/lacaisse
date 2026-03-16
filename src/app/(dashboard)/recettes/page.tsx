import { getRecettes, getRecetteOverviewStats, getRecetteYears } from "@/features/recettes/queries";
import { getLocations } from "@/features/admin/locations/queries";
import { getCategories } from "@/features/admin/categories/queries";
import { getPaymentMethods } from "@/features/admin/payment-methods/queries";
import { RecettesClient } from "./RecettesClient";

export default async function RecettesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const monthStart = formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = formatDateLocal(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const dateFrom = params.date_from || monthStart;
  const dateTo = params.date_to || monthEnd;
  const parsedFrom = new Date(dateFrom);
  const statsMonth =
    params.filter_month && Number(params.filter_month) >= 1 && Number(params.filter_month) <= 12
      ? Number(params.filter_month)
      : !Number.isNaN(parsedFrom.getTime())
        ? parsedFrom.getMonth() + 1
        : now.getMonth() + 1;
  const statsYear =
    params.filter_year && Number(params.filter_year) > 0
      ? Number(params.filter_year)
      : !Number.isNaN(parsedFrom.getTime())
        ? parsedFrom.getFullYear()
        : now.getFullYear();

  const [result, locations, categories, paymentMethods, years, overviewStats] = await Promise.all([
    getRecettes({
      location_id: params.location_id ? parseInt(params.location_id) : undefined,
      category: params.category || undefined,
      payment_method: params.payment_method || undefined,
      date_from: dateFrom,
      date_to: dateTo,
      search: params.search || undefined,
      no_pagination: true,
    }),
    getLocations(),
    getCategories("rct"),
    getPaymentMethods(),
    getRecetteYears(),
    getRecetteOverviewStats(statsMonth, statsYear),
  ]);

  return (
    <RecettesClient
      result={result}
      locations={locations}
      categories={categories}
      paymentMethods={paymentMethods}
      years={years}
      overviewStats={overviewStats}
    />
  );
}

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
