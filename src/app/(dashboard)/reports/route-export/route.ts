import { NextRequest, NextResponse } from "next/server";
import {
  getAllTransactionsForReportExport,
  getMonthlyReport,
  getTransactionsForReportExport,
  getWeeklyReport,
  getYearlyReport,
} from "@/features/reports/queries";
import {
  generateAllDataExcel,
  generateMonthlyExcel,
} from "@/features/reports/export/excel";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(
    searchParams.get("month") ?? String(new Date().getMonth() + 1),
    10
  );
  const year = parseInt(
    searchParams.get("year") ?? String(new Date().getFullYear()),
    10
  );
  const scope = (searchParams.get("scope") ?? "monthly").toLowerCase();

  if (scope === "all") {
    const [monthly, weekly, yearly, rows] = await Promise.all([
      getMonthlyReport(month, year),
      getWeeklyReport(year, month),
      getYearlyReport(year),
      getAllTransactionsForReportExport(),
    ]);

    const buffer = await generateAllDataExcel({
      month,
      year,
      monthly,
      weekly,
      yearly,
      rows,
    });

    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `rapport-global-${stamp}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const [report, records] = await Promise.all([
    getMonthlyReport(month, year),
    getTransactionsForReportExport({ month, year }),
  ]);
  const buffer = await generateMonthlyExcel(report, records);

  const monthNames = [
    "Janvier",
    "Fevrier",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Aout",
    "Septembre",
    "Octobre",
    "Novembre",
    "Decembre",
  ];
  const filename = `rapport-${monthNames[month - 1]}-${year}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
