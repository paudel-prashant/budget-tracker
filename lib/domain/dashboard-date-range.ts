import dayjs, { type Dayjs } from "dayjs";
import type { DashboardDatePreset, DashboardDateRange } from "@/lib/types";

export const DASHBOARD_DATE_PRESETS: DashboardDatePreset[] = [
  "this_week",
  "this_month",
  "last_month",
  "last_3_months",
  "custom",
];

export const DASHBOARD_DATE_PRESET_LABELS: Record<DashboardDatePreset, string> = {
  this_week: "This week",
  this_month: "This month",
  last_month: "Last month",
  last_3_months: "Last 3 months",
  custom: "Custom",
};

export const DEFAULT_DASHBOARD_DATE_PRESET: DashboardDatePreset = "this_month";

export type ResolvedDashboardDateRange = {
  preset: DashboardDatePreset;
  dateFrom: string;
  dateTo: string;
  start: Date;
  end: Date;
};

function toRange(preset: DashboardDatePreset, from: Dayjs, to: Dayjs): ResolvedDashboardDateRange {
  const dateFrom = from.startOf("day").toISOString();
  const dateTo = to.endOf("day").toISOString();

  return {
    preset,
    dateFrom,
    dateTo,
    start: new Date(dateFrom),
    end: new Date(dateTo),
  };
}

export function resolveDashboardDateRange(
  input: Pick<DashboardDateRange, "preset"> & Partial<Pick<DashboardDateRange, "dateFrom" | "dateTo">>
): ResolvedDashboardDateRange {
  const now = dayjs();

  switch (input.preset) {
    case "this_week":
      return toRange("this_week", now.startOf("week"), now);
    case "this_month":
      return toRange("this_month", now.startOf("month"), now);
    case "last_month": {
      const last = now.subtract(1, "month");
      return toRange("last_month", last.startOf("month"), last.endOf("month"));
    }
    case "last_3_months":
      return toRange("last_3_months", now.subtract(2, "month").startOf("month"), now);
    case "custom": {
      const from = dayjs(input.dateFrom);
      const to = dayjs(input.dateTo);
      if (!from.isValid() || !to.isValid()) {
        throw new Error("Invalid custom date range");
      }
      if (from.isAfter(to)) {
        throw new Error("Start date cannot be after end date");
      }
      return toRange("custom", from, to);
    }
    default:
      return toRange(DEFAULT_DASHBOARD_DATE_PRESET, now.startOf("month"), now);
  }
}

export function getDefaultDashboardDateRange(): ResolvedDashboardDateRange {
  return resolveDashboardDateRange({ preset: DEFAULT_DASHBOARD_DATE_PRESET });
}

export function toDashboardDateRange(resolved: ResolvedDashboardDateRange): DashboardDateRange {
  return {
    preset: resolved.preset,
    dateFrom: resolved.dateFrom,
    dateTo: resolved.dateTo,
  };
}

export function formatDashboardDateRangeLabel(range: DashboardDateRange): string {
  const from = dayjs(range.dateFrom);
  const to = dayjs(range.dateTo);

  if (!from.isValid() || !to.isValid()) {
    return DASHBOARD_DATE_PRESET_LABELS[range.preset];
  }

  if (range.preset !== "custom") {
    return DASHBOARD_DATE_PRESET_LABELS[range.preset];
  }

  const sameYear = from.year() === to.year();
  const fromLabel = from.format(sameYear ? "MMM D" : "MMM D, YYYY");
  const toLabel = to.format("MMM D, YYYY");
  return `${fromLabel} – ${toLabel}`;
}

export function buildDashboardMetricsQuery(range: DashboardDateRange): string {
  const params = new URLSearchParams();
  params.set("preset", range.preset);
  if (range.preset === "custom") {
    params.set("dateFrom", range.dateFrom);
    params.set("dateTo", range.dateTo);
  }
  return params.toString();
}

export function parseDashboardMetricsSearchParams(
  searchParams: URLSearchParams
): { success: true; range: ResolvedDashboardDateRange } | { success: false; error: string } {
  const presetParam = searchParams.get("preset") as DashboardDatePreset | null;

  if (!presetParam || !DASHBOARD_DATE_PRESETS.includes(presetParam)) {
    return { success: false, error: "Invalid or missing preset" };
  }

  if (presetParam === "custom") {
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    if (!dateFrom || !dateTo) {
      return { success: false, error: "Custom range requires dateFrom and dateTo" };
    }
    try {
      return {
        success: true,
        range: resolveDashboardDateRange({ preset: "custom", dateFrom, dateTo }),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Invalid custom date range",
      };
    }
  }

  return {
    success: true,
    range: resolveDashboardDateRange({ preset: presetParam }),
  };
}

export function getRangeStartDateKey(range: ResolvedDashboardDateRange): string {
  return range.dateFrom.slice(0, 10);
}
