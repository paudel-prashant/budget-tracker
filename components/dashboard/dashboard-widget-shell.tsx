"use client";

import { type ReactNode } from "react";
import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { DASHBOARD_WIDGET_META, type DashboardWidgetId } from "@/lib/domain/dashboard-layout";

type DashboardWidgetShellProps = {
  widgetId: DashboardWidgetId;
  children: ReactNode;
  isDragging?: boolean;
  isDropTarget?: boolean;
  customizeMode?: boolean;
  onHide?: () => void;
  dragHandleProps?: {
    draggable: boolean;
    onDragStart: () => void;
    onDragEnd: () => void;
  };
};

export function DashboardWidgetShell({
  widgetId,
  children,
  isDragging,
  isDropTarget,
  customizeMode,
  onHide,
  dragHandleProps,
}: DashboardWidgetShellProps) {
  const theme = useTheme();
  const meta = DASHBOARD_WIDGET_META[widgetId];

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        opacity: isDragging ? 0.45 : 1,
        transition: "opacity 0.15s ease",
        outline: isDropTarget ? `2px dashed ${theme.palette.primary.main}` : "none",
        outlineOffset: 4,
        borderRadius: 2,
      }}
    >
      {customizeMode && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{
            mb: 1,
            px: 0.5,
            py: 0.75,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            border: 1,
            borderColor: "divider",
          }}
        >
          <Tooltip title="Drag to reorder">
            <IconButton
              size="small"
              aria-label={`Drag ${meta.label} widget`}
              sx={{ cursor: "grab", color: "text.secondary" }}
              {...dragHandleProps}
            >
              <DragIndicatorOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" fontWeight={600} sx={{ flex: 1 }}>
            {meta.label}
          </Typography>
          {onHide && (
            <Tooltip title="Hide widget">
              <IconButton
                size="small"
                aria-label={`Hide ${meta.label} widget`}
                onClick={onHide}
                sx={{ color: "text.secondary" }}
              >
                <VisibilityOffOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )}

      <SurfaceCard
        sx={{
          p: CARD_PADDING,
          width: "100%",
          minWidth: 0,
          overflow: "visible",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!customizeMode && (
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: "block", lineHeight: 1.4 }}
            >
              {meta.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {meta.description}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          {children}
        </Box>
      </SurfaceCard>
    </Box>
  );
}
