import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return <DashboardContent data={data} />;
}
