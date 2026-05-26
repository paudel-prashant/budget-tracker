import { DashboardOfflineCache } from "@/components/pwa/dashboard-offline-cache";
import { DashboardOfflineShell } from "@/components/pwa/dashboard-offline-shell";
import { getDashboardLayout } from "@/lib/data/dashboard-layout-data";
import type { DashboardData } from "@/lib/types";

type DashboardContentProps = {
  data: DashboardData;
  userId: string;
};

export async function DashboardContent({ data, userId }: DashboardContentProps) {
  const initialLayout = await getDashboardLayout(userId);

  return (
    <DashboardOfflineCache data={data} layout={initialLayout}>
      <DashboardOfflineShell initialData={data} initialLayout={initialLayout} />
    </DashboardOfflineCache>
  );
}
