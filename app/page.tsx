import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { RefreshDashboardOnReturn } from "@/components/dashboard/refresh-dashboard-on-return";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const data = await getDashboardData(userId);

  return (
    <>
      <RefreshDashboardOnReturn />
      <DashboardContent data={data} />
    </>
  );
}
