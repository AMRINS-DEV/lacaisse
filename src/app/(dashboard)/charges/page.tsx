import { getCharges, getChargeOverviewStats, getChargeYears } from "@/features/charges/queries";
import { getLocations } from "@/features/admin/locations/queries";
import { getCategories } from "@/features/admin/categories/queries";
import { getPaymentMethods } from "@/features/admin/payment-methods/queries";
import { ChargesClient } from "./ChargesClient";

export default async function ChargesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const monthStart = formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = formatDateLocal(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const effectiveDateFrom = params.date_from || monthStart;
  const effectiveDateTo = params.date_to || monthEnd;

  const [result, locations, categories, paymentMethods, years, overviewStats] = await Promise.all([
    getCharges({
      location_id: params.location_id ? parseInt(params.location_id) : undefined,
      category: params.category || undefined,
      payment_method: params.payment_method || undefined,
      date_from: effectiveDateFrom,
      date_to: effectiveDateTo,
      search: params.search || undefined,
      no_pagination: true,
    }),
    getLocations(),
    getCategories(),
    getPaymentMethods(),
    getChargeYears(),
    getChargeOverviewStats(
      Number(params.filter_month ?? now.getMonth() + 1),
      Number(params.filter_year ?? now.getFullYear())
    ),
  ]);

  return (
    <ChargesClient
      result={result}
      locations={locations}
      categories={categories.filter((category) => category.type === "expense")}
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
