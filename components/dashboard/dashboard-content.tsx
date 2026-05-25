import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardLayout } from "@/lib/data/dashboard-layout-data";
import type { DashboardData } from "@/lib/types";

type DashboardContentProps = {
  data: DashboardData;
  userId: string;
};

export async function DashboardContent({ data, userId }: DashboardContentProps) {
  const initialLayout = await getDashboardLayout(userId);
  return <DashboardView data={data} initialLayout={initialLayout} />;
}
