import { getMonthlyReport, getWeeklyReport, getYearlyReport } from "@/features/reports/queries";
import { ReportsClient } from "./ReportsClient";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const tab = params.tab ?? "monthly";

  const [monthly, weekly, yearly] = await Promise.all([
    getMonthlyReport(month, year),
    getWeeklyReport(year, month),
    getYearlyReport(year),
  ]);

  return (
    <ReportsClient
      monthly={monthly}
      weekly={weekly}
      yearly={yearly}
      month={month}
      year={year}
      activeTab={tab}
    />
  );
}
