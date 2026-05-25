export const DASHBOARD_WIDGET_IDS = [
  "balance",
  "charts",
  "budgets",
  "goals",
  "insights",
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

export type DashboardWidgetConfig = {
  id: DashboardWidgetId;
  visible: boolean;
  order: number;
};

export type DashboardLayoutPreferences = {
  widgets: DashboardWidgetConfig[];
};

export const DASHBOARD_WIDGET_META: Record<
  DashboardWidgetId,
  { label: string; description: string; fullWidth?: boolean }
> = {
  balance: {
    label: "Balance",
    description: "Income, expenses, and net balance summary",
    fullWidth: true,
  },
  charts: {
    label: "Charts",
    description: "Balance over time and monthly income vs expenses",
    fullWidth: true,
  },
  budgets: {
    label: "Budgets",
    description: "Budget health and overspend warnings",
    fullWidth: true,
  },
  goals: {
    label: "Goals",
    description: "Savings and budget goal progress",
    fullWidth: true,
  },
  insights: {
    label: "Insights",
    description: "Personalized spending and savings insights",
    fullWidth: true,
  },
};

export function createDefaultDashboardLayout(): DashboardLayoutPreferences {
  return {
    widgets: DASHBOARD_WIDGET_IDS.map((id, order) => ({
      id,
      visible: true,
      order,
    })),
  };
}

export function normalizeDashboardLayout(input: unknown): DashboardLayoutPreferences {
  const defaults = createDefaultDashboardLayout();
  const defaultById = new Map(defaults.widgets.map((w) => [w.id, w]));

  if (!input || typeof input !== "object") {
    return defaults;
  }

  const record = input as { widgets?: unknown };
  if (!Array.isArray(record.widgets)) {
    return defaults;
  }

  const parsed = new Map<DashboardWidgetId, DashboardWidgetConfig>();

  for (const item of record.widgets) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = row.id;
    if (typeof id !== "string" || !DASHBOARD_WIDGET_IDS.includes(id as DashboardWidgetId)) {
      continue;
    }
    const widgetId = id as DashboardWidgetId;
    parsed.set(widgetId, {
      id: widgetId,
      visible: row.visible !== false,
      order: typeof row.order === "number" && Number.isFinite(row.order) ? row.order : 0,
    });
  }

  for (const id of DASHBOARD_WIDGET_IDS) {
    if (!parsed.has(id)) {
      parsed.set(id, { ...defaultById.get(id)! });
    }
  }

  const widgets = [...parsed.values()].sort((a, b) => a.order - b.order);
  return {
    widgets: widgets.map((widget, index) => ({ ...widget, order: index })),
  };
}

export function getVisibleWidgetOrder(layout: DashboardLayoutPreferences): DashboardWidgetId[] {
  return layout.widgets
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order)
    .map((w) => w.id);
}

export function reorderWidgets(
  layout: DashboardLayoutPreferences,
  activeId: DashboardWidgetId,
  overId: DashboardWidgetId
): DashboardLayoutPreferences {
  const visible = getVisibleWidgetOrder(layout);
  const fromIndex = visible.indexOf(activeId);
  const toIndex = visible.indexOf(overId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return layout;
  }

  const nextVisible = [...visible];
  const [moved] = nextVisible.splice(fromIndex, 1);
  nextVisible.splice(toIndex, 0, moved);

  const orderById = new Map(nextVisible.map((id, index) => [id, index]));
  const hidden = layout.widgets.filter((w) => !w.visible).map((w) => w.id);

  let hiddenOrder = nextVisible.length;
  const widgets = layout.widgets
    .map((widget) => {
      if (!widget.visible) {
        const order = hiddenOrder;
        hiddenOrder += 1;
        return { ...widget, order };
      }
      return { ...widget, order: orderById.get(widget.id) ?? widget.order };
    })
    .sort((a, b) => a.order - b.order);

  return { widgets };
}

export function setWidgetVisibility(
  layout: DashboardLayoutPreferences,
  widgetId: DashboardWidgetId,
  visible: boolean
): DashboardLayoutPreferences {
  const widgets = layout.widgets.map((w) =>
    w.id === widgetId ? { ...w, visible } : w
  );
  const visibleItems = widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order);
  const hiddenItems = widgets.filter((w) => !w.visible).sort((a, b) => a.order - b.order);
  const merged = [...visibleItems, ...hiddenItems].map((w, index) => ({ ...w, order: index }));
  return { widgets: merged };
}
