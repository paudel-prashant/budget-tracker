import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MonthlyReportContent } from "@/components/reports/monthly-report-content";
import { getMonthlyReport } from "@/lib/data/monthly-report-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ReportsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const initial = await getMonthlyReport(userId);

  return <MonthlyReportContent initial={initial} />;
}
