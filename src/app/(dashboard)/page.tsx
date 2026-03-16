import { getKpiSummary, getLocationSummaries, getTopCategories, getMonthlyTrend } from "@/features/dashboard/queries";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const [kpi, locations, topRecettes, topCharges, trend] = await Promise.all([
    getKpiSummary(month, year),
    getLocationSummaries(month, year),
    getTopCategories(month, year, "income"),
    getTopCategories(month, year, "expense"),
    getMonthlyTrend(year),
  ]);

  return (
    <DashboardClient
      kpi={kpi}
      locations={locations}
      topRecettes={topRecettes}
      topCharges={topCharges}
      trend={trend}
      month={month}
      year={year}
    />
  );
}
