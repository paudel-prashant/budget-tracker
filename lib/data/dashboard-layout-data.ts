import { Prisma } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import {
  createDefaultDashboardLayout,
  normalizeDashboardLayout,
  type DashboardLayoutPreferences,
} from "@/lib/domain/dashboard-layout";

export async function getDashboardLayout(
  userId: string
): Promise<DashboardLayoutPreferences> {
  assertDatabaseUrl();

  const row = await prisma.dashboardLayout.findUnique({
    where: { userId },
    select: { widgets: true },
  });

  if (!row) {
    return createDefaultDashboardLayout();
  }

  return normalizeDashboardLayout(row.widgets);
}

export async function saveDashboardLayout(
  userId: string,
  layout: DashboardLayoutPreferences
): Promise<DashboardLayoutPreferences> {
  assertDatabaseUrl();

  const normalized = normalizeDashboardLayout(layout);

  await prisma.dashboardLayout.upsert({
    where: { userId },
    create: {
      userId,
      widgets: normalized as unknown as Prisma.InputJsonValue,
    },
    update: {
      widgets: normalized as unknown as Prisma.InputJsonValue,
    },
  });

  return normalized;
}
