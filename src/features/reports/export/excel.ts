import ExcelJS from "exceljs";
import type {
  MonthlyReport,
  ReportExportRow,
  WeeklyReport,
  YearlyReport,
} from "../queries";

export async function generateMonthlyExcel(
  report: MonthlyReport,
  records: ReportExportRow[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  styleWorkbook(workbook);

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

  const summary = workbook.addWorksheet("Resume");
  summary.addRow(["Rapport mensuel", `${monthNames[report.month - 1]} ${report.year}`]);
  summary.addRow([]);
  summary.addRow(["Indicateur", "Montant (MAD)"]);
  summary.addRow(["Total Recettes", report.kpi.total_recettes]);
  summary.addRow(["Total Charges", report.kpi.total_charges]);
  summary.addRow(["Solde Net", report.kpi.net_balance]);
  summary.addRow(["Nombre de records", report.kpi.total_records]);
  styleSummarySheet(summary);

  const catRct = workbook.addWorksheet("Recettes par Categorie");
  catRct.addRow(["Categorie", "Total (MAD)"]);
  for (const row of report.by_category_recettes) catRct.addRow([row.category, row.total]);
  styleSimpleTable(catRct, [34, 18], [2]);

  const catCh = workbook.addWorksheet("Charges par Categorie");
  catCh.addRow(["Categorie", "Total (MAD)"]);
  for (const row of report.by_category_charges) catCh.addRow([row.category, row.total]);
  styleSimpleTable(catCh, [34, 18], [2]);

  const byLoc = workbook.addWorksheet("Par Caisse");
  byLoc.addRow(["Caisse", "Recettes", "Charges", "Net"]);
  for (const row of report.by_location) {
    byLoc.addRow([row.location_name, row.recettes, row.charges, row.net]);
  }
  styleSimpleTable(byLoc, [28, 16, 16, 16], [2, 3, 4], true);

  const recordsSheet = workbook.addWorksheet("Records mensuels");
  recordsSheet.addRow([
    "Date",
    "Montant (MAD)",
    "Description",
    "Categorie",
    "Caisse",
    "Paiement",
    "Type",
  ]);
  for (const row of records) {
    recordsSheet.addRow([
      row.date,
      row.amount,
      row.description,
      row.category,
      row.location_name,
      row.payment_method,
      row.type === "income" ? "Recette" : "Charge",
    ]);
  }
  styleSimpleTable(recordsSheet, [14, 16, 48, 24, 22, 22, 12], [2]);
  colorTransactionTypeRows(recordsSheet, 2, 7);
  addSplitRecordSheets(workbook, records);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function generateAllDataExcel(payload: {
  month: number;
  year: number;
  monthly: MonthlyReport;
  yearly: YearlyReport;
  weekly: WeeklyReport[];
  rows: ReportExportRow[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  styleWorkbook(workbook);

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

  const recettes = payload.rows
    .filter((row) => row.type === "income")
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const charges = payload.rows
    .filter((row) => row.type === "expense")
    .reduce((sum, row) => sum + Number(row.amount), 0);

  const summary = workbook.addWorksheet("Resume global");
  summary.addRow(["Rapport global", "Toutes donnees"]);
  summary.addRow(["Periode de reference", `${monthNames[payload.month - 1]} ${payload.year}`]);
  summary.addRow([]);
  summary.addRow(["Indicateur", "Montant (MAD)"]);
  summary.addRow(["Total Recettes (global)", recettes]);
  summary.addRow(["Total Charges (global)", charges]);
  summary.addRow(["Solde Net (global)", recettes - charges]);
  summary.addRow(["Nombre total de records", payload.rows.length]);
  styleSummarySheet(summary);

  const monthlyTrend = workbook.addWorksheet("Tendance annuelle");
  monthlyTrend.addRow(["Mois", "Recettes", "Charges", "Net"]);
  for (const row of payload.yearly.months) {
    monthlyTrend.addRow([row.label, row.recettes, row.charges, row.net]);
  }
  styleSimpleTable(monthlyTrend, [14, 16, 16, 16], [2, 3, 4], true);

  const weekly = workbook.addWorksheet("Hebdomadaire");
  weekly.addRow(["Semaine", "Recettes", "Charges", "Net"]);
  for (const row of payload.weekly) {
    weekly.addRow([row.week_label, row.recettes, row.charges, row.net]);
  }
  styleSimpleTable(weekly, [20, 16, 16, 16], [2, 3, 4], true);

  const monthly = workbook.addWorksheet("Mensuel selectionne");
  monthly.addRow(["Categorie", "Total recettes"]);
  for (const row of payload.monthly.by_category_recettes) {
    monthly.addRow([row.category, row.total]);
  }
  monthly.addRow([]);
  monthly.addRow(["Categorie", "Total charges"]);
  for (const row of payload.monthly.by_category_charges) {
    monthly.addRow([row.category, row.total]);
  }
  styleSplitMonthlySheet(monthly);

  const allData = workbook.addWorksheet("Toutes transactions");
  allData.addRow([
    "Date",
    "Montant (MAD)",
    "Description",
    "Categorie",
    "Caisse",
    "Paiement",
    "Type",
  ]);
  for (const row of payload.rows) {
    allData.addRow([
      row.date,
      row.amount,
      row.description,
      row.category,
      row.location_name,
      row.payment_method,
      row.type === "income" ? "Recette" : "Charge",
    ]);
  }
  styleSimpleTable(allData, [14, 16, 48, 24, 22, 22, 12], [2]);
  colorTransactionTypeRows(allData, 2, 7);
  addSplitRecordSheets(workbook, payload.rows);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function styleWorkbook(workbook: ExcelJS.Workbook) {
  workbook.creator = "Caisse Next";
  workbook.lastModifiedBy = "Caisse Next";
  workbook.created = new Date();
  workbook.modified = new Date();
}

function styleSummarySheet(sheet: ExcelJS.Worksheet) {
  sheet.columns = [{ width: 34 }, { width: 24 }];

  const title = sheet.getRow(1);
  title.font = { bold: true, size: 14, color: { argb: "FF0F172A" } };
  title.getCell(2).font = { bold: true, size: 12, color: { argb: "FF0EA5E9" } };

  const header = sheet.getRow(3);
  styleHeaderRow(header);

  for (let r = 4; r <= sheet.rowCount; r += 1) {
    const row = sheet.getRow(r);
    const label = String(row.getCell(1).value ?? "").toLowerCase();
    applyRowBorder(row, 2);

    if (typeof row.getCell(2).value === "number") {
      row.getCell(2).numFmt = "#,##0.00";
      row.getCell(2).alignment = { horizontal: "right" };
    }

    if (label.includes("solde") || label.includes("total") || label.includes("record")) {
      row.font = { bold: true };
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFF6FF" },
      };
    }
  }
}

function styleSimpleTable(
  sheet: ExcelJS.Worksheet,
  widths: number[],
  currencyCols: number[] = [],
  emphasizeLastRow = false
) {
  sheet.columns = widths.map((width) => ({ width }));

  const header = sheet.getRow(1);
  styleHeaderRow(header);
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: widths.length },
  };

  for (let r = 2; r <= sheet.rowCount; r += 1) {
    const row = sheet.getRow(r);
    applyRowBorder(row, widths.length);

    if (r % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFAFCFF" },
      };
    }

    for (const col of currencyCols) {
      const cell = row.getCell(col);
      if (typeof cell.value === "number") {
        cell.numFmt = "#,##0.00";
        cell.alignment = { horizontal: "right" };
      }
    }
  }

  if (emphasizeLastRow && sheet.rowCount >= 2) {
    const last = sheet.getRow(sheet.rowCount);
    last.font = { bold: true };
    last.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2F5FF" },
    };
  }
}

function styleSplitMonthlySheet(sheet: ExcelJS.Worksheet) {
  sheet.columns = [{ width: 34 }, { width: 18 }];
  styleHeaderRow(sheet.getRow(1));

  let secondHeaderRow = 0;
  for (let i = 2; i <= sheet.rowCount; i += 1) {
    const c1 = String(sheet.getRow(i).getCell(1).value ?? "").toLowerCase();
    const c2 = String(sheet.getRow(i).getCell(2).value ?? "").toLowerCase();
    if (c1 === "categorie" && c2.includes("charge")) {
      secondHeaderRow = i;
      break;
    }
  }

  if (secondHeaderRow > 0) {
    styleHeaderRow(sheet.getRow(secondHeaderRow));
  }

  for (let r = 2; r <= sheet.rowCount; r += 1) {
    const row = sheet.getRow(r);
    const cellA = String(row.getCell(1).value ?? "").toLowerCase();
    const cellB = String(row.getCell(2).value ?? "").toLowerCase();

    if (!cellA && !cellB) continue;
    applyRowBorder(row, 2);
    if (cellA === "categorie") continue;

    const amountCell = row.getCell(2);
    if (typeof amountCell.value === "number") {
      amountCell.numFmt = "#,##0.00";
      amountCell.alignment = { horizontal: "right" };
    }
  }
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.alignment = { vertical: "middle" };
  row.height = 20;
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F4EEE" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });
}

function applyRowBorder(row: ExcelJS.Row, colCount: number) {
  for (let c = 1; c <= colCount; c += 1) {
    row.getCell(c).border = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  }
}

function colorTransactionTypeRows(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  typeColumn = 2
) {
  for (let r = startRow; r <= sheet.rowCount; r += 1) {
    const row = sheet.getRow(r);
    const typeCell = row.getCell(typeColumn);
    const type = String(typeCell.value ?? "").toLowerCase();

    if (type.includes("recette")) {
      typeCell.font = { color: { argb: "FF0F766E" }, bold: true };
      typeCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFECFDF5" },
      };
    } else if (type.includes("charge")) {
      typeCell.font = { color: { argb: "FF9F1239" }, bold: true };
      typeCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF1F2" },
      };
    }
  }
}

function addSplitRecordSheets(workbook: ExcelJS.Workbook, rows: ReportExportRow[]) {
  const recettes = rows.filter((row) => row.type === "income");
  const charges = rows.filter((row) => row.type === "expense");

  const recettesSheet = workbook.addWorksheet("Records recettes");
  recettesSheet.addRow([
    "Date",
    "Montant (MAD)",
    "Description",
    "Categorie",
    "Caisse",
    "Paiement",
  ]);
  for (const row of recettes) {
    recettesSheet.addRow([
      row.date,
      row.amount,
      row.description,
      row.category,
      row.location_name,
      row.payment_method,
    ]);
  }
  styleSimpleTable(recettesSheet, [14, 16, 48, 24, 22, 22], [2]);

  const chargesSheet = workbook.addWorksheet("Records charges");
  chargesSheet.addRow([
    "Date",
    "Montant (MAD)",
    "Description",
    "Categorie",
    "Caisse",
    "Paiement",
  ]);
  for (const row of charges) {
    chargesSheet.addRow([
      row.date,
      row.amount,
      row.description,
      row.category,
      row.location_name,
      row.payment_method,
    ]);
  }
  styleSimpleTable(chargesSheet, [14, 16, 48, 24, 22, 22], [2]);
}
