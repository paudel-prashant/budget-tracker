"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "@mui/material";
import { DashboardWidgetShell } from "@/components/dashboard/dashboard-widget-shell";
import {
  getVisibleWidgetOrder,
  reorderWidgets,
  setWidgetVisibility,
  type DashboardLayoutPreferences,
  type DashboardWidgetId,
} from "@/lib/domain/dashboard-layout";

type DashboardWidgetGridProps = {
  layout: DashboardLayoutPreferences;
  customizeMode: boolean;
  onLayoutChange: (layout: DashboardLayoutPreferences) => void;
  renderWidget: (id: DashboardWidgetId) => ReactNode;
};

export function DashboardWidgetGrid({
  layout,
  customizeMode,
  onLayoutChange,
  renderWidget,
}: DashboardWidgetGridProps) {
  const [draggingId, setDraggingId] = useState<DashboardWidgetId | null>(null);
  const [dropTargetId, setDropTargetId] = useState<DashboardWidgetId | null>(null);
  const visibleIds = getVisibleWidgetOrder(layout);

  const handleDragStart = useCallback((id: DashboardWidgetId) => {
    setDraggingId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggingId && dropTargetId && draggingId !== dropTargetId) {
      onLayoutChange(reorderWidgets(layout, draggingId, dropTargetId));
    }
    setDraggingId(null);
    setDropTargetId(null);
  }, [draggingId, dropTargetId, layout, onLayoutChange]);

  const handleDrop = useCallback((targetId: DashboardWidgetId) => {
    if (!draggingId || draggingId === targetId) return;
    onLayoutChange(reorderWidgets(layout, draggingId, targetId));
    setDraggingId(null);
    setDropTargetId(null);
  }, [draggingId, layout, onLayoutChange]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: { xs: 2.5, md: 3 },
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {visibleIds.map((widgetId) => (
        <Box
          key={widgetId}
          onDragOver={(event) => {
            if (!customizeMode || !draggingId) return;
            event.preventDefault();
            setDropTargetId(widgetId);
          }}
          onDrop={(event) => {
            if (!customizeMode) return;
            event.preventDefault();
            handleDrop(widgetId);
          }}
        >
          <DashboardWidgetShell
            widgetId={widgetId}
            customizeMode={customizeMode}
            isDragging={draggingId === widgetId}
            isDropTarget={dropTargetId === widgetId && draggingId !== widgetId}
            onHide={
              customizeMode
                ? () => onLayoutChange(setWidgetVisibility(layout, widgetId, false))
                : undefined
            }
            dragHandleProps={
              customizeMode
                ? {
                    draggable: true,
                    onDragStart: () => handleDragStart(widgetId),
                    onDragEnd: handleDragEnd,
                  }
                : undefined
            }
          >
            {renderWidget(widgetId)}
          </DashboardWidgetShell>
        </Box>
      ))}
    </Box>
  );
}

/** Debounced persist hook for layout saves */
export function usePersistDashboardLayout(
  layout: DashboardLayoutPreferences,
  initialSerialized: string
) {
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(initialSerialized);

  const persist = useCallback(async (next: DashboardLayoutPreferences) => {
    const serialized = JSON.stringify(next);
    if (serialized === lastSavedRef.current) return;

    setSaving(true);
    try {
      const response = await fetch("/api/dashboard/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: next.widgets }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to save layout");
      }
      lastSavedRef.current = serialized;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    const serialized = JSON.stringify(layout);
    if (serialized === lastSavedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void persist(layout);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [layout, persist]);

  return { saving };
}
