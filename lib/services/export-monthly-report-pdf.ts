import { APP_NAME } from "@/lib/config/app";
import type { MonthlyReport } from "@/lib/types";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils/format";

function formatChange(value: number | null): string {
  if (value === null) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatPercent(value)}`;
}

export async function downloadMonthlyReportPdf(report: MonthlyReport): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  const primary: [number, number, number] = [79, 70, 229];
  const textMuted: [number, number, number] = [100, 116, 139];

  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 72, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(`${APP_NAME} — Monthly Report`, margin, 36);
  doc.setFontSize(11);
  doc.text(report.monthLabelLong, margin, 54);

  y = 96;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setTextColor(...textMuted);
  doc.text(`Generated ${formatDate(report.generatedAt)}`, margin, y);
  y += 28;

  const summaryRows = [
    ["Total income", formatCurrency(report.summary.totalIncome)],
    ["Total expenses", formatCurrency(report.summary.totalExpenses)],
    [
      "Savings",
      `${formatCurrency(report.summary.savings)}${
        report.summary.savingsRate !== null
          ? ` (${formatPercent(report.summary.savingsRate)} of income)`
          : ""
      }`,
    ],
    ["Transactions", String(report.summary.transactionCount)],
  ];

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.text("Summary", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Metric", "Value"]],
    body: summaryRows,
    theme: "grid",
    headStyles: { fillColor: primary, textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
  });

  y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 60;
  y += 20;

  doc.setFontSize(13);
  doc.text("Month-over-month", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Metric", `vs ${report.comparison.previousMonthLabel}`]],
    body: [
      ["Income", formatChange(report.comparison.incomeChangePercent)],
      ["Expenses", formatChange(report.comparison.expenseChangePercent)],
      ["Savings", formatChange(report.comparison.savingsChangePercent)],
    ],
    theme: "striped",
    headStyles: { fillColor: primary, textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
  });

  y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 60;
  y += 20;

  const addCategoryTable = (title: string, rows: MonthlyReport["topExpenseCategories"]) => {
    if (doc.internal.pageSize.getHeight() - y < 120) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin, y);
    y += 8;

    if (rows.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(...textMuted);
      doc.text("No data for this period.", margin, y + 12);
      y += 32;
      return;
    }

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Category", "Amount", "% of total", "Transactions"]],
      body: rows.map((row) => [
        row.category,
        formatCurrency(row.amount),
        formatPercent(row.percentOfTotal),
        String(row.transactionCount),
      ]),
      theme: "striped",
      headStyles: { fillColor: primary, textColor: 255 },
      styles: { fontSize: 9, cellPadding: 5 },
    });

    y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;
    y += 16;
  };

  addCategoryTable("Top expense categories", report.topExpenseCategories);
  addCategoryTable("Top income categories", report.topIncomeCategories);

  const filename = `bugetrax-report-${report.month}.pdf`;
  doc.save(filename);
}
