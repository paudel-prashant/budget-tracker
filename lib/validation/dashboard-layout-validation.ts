import {
  normalizeDashboardLayout,
  type DashboardLayoutPreferences,
} from "@/lib/domain/dashboard-layout";

type ValidationResult =
  | { success: true; data: DashboardLayoutPreferences }
  | { success: false; error: string };

export function validateDashboardLayoutBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid request body" };
  }

  const record = body as Record<string, unknown>;
  if (!Array.isArray(record.widgets)) {
    return { success: false, error: "widgets array is required" };
  }

  const normalized = normalizeDashboardLayout({ widgets: record.widgets });
  const visibleCount = normalized.widgets.filter((w) => w.visible).length;

  if (visibleCount === 0) {
    return { success: false, error: "At least one widget must remain visible" };
  }

  return { success: true, data: normalized };
}
