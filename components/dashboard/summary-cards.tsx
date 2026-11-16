"use client";

import { useState } from "react";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { Box, ButtonBase, Stack, Typography, alpha, useTheme } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import {
  BalanceSummaryDetailDrawer,
  type BalanceSummaryKind,
} from "@/components/dashboard/balance-summary-detail-drawer";
import { HeroBanner } from "@/components/shared/ui/viz/hero-banner";
import { SegmentedBar } from "@/components/shared/ui/viz/segmented-bar";
import { getCategoricalPalette } from "@/lib/theme/chart-styles";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { DashboardDateRange, Summary } from "@/lib/types";

type SummaryCardsProps = {
  summary: Summary;
  dateRange: DashboardDateRange;
  dimmed?: boolean;
};

function DrillButton({
  icon: Icon,
  label,
  value,
  color,
  onClick,
  disabled,
}: {
  icon: SvgIconComponent;
  label: string;
  value: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label}: ${value}. View details`}
      sx={{
        width: "100%",
        justifyContent: "flex-start",
        textAlign: "left",
        p: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        transition: "border-color 150ms ease, transform 150ms ease",
        "&:hover": { borderColor: alpha(color, 0.5), transform: "translateY(-1px)" },
        "&:hover .drill-arrow": { transform: "translateX(3px)", opacity: 1 },
        "&:focus-visible": { outline: 2, outlineColor: "primary.main", outlineOffset: 2 },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            color,
            bgcolor: alpha(color, 0.14),
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {label}
          </Typography>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {value}
          </Typography>
        </Box>
        <ArrowForwardRoundedIcon
          className="drill-arrow"
          sx={{ fontSize: 18, color: "text.secondary", opacity: 0.6, transition: "transform 150ms ease, opacity 150ms ease" }}
        />
      </Stack>
    </ButtonBase>
  );
}

/** Net balance for the selected range, with drill-downs into income, expenses and balance. */
export function SummaryCards({ summary, dateRange, dimmed = false }: SummaryCardsProps) {
  const theme = useTheme();
  const palette = getCategoricalPalette(theme);
  const [detailKind, setDetailKind] = useState<BalanceSummaryKind | null>(null);
  const kept = Math.max(0, summary.totalIncome - summary.totalExpenses);
  const spentOfIncome = Math.min(summary.totalExpenses, summary.totalIncome);
  const keptShare = summary.totalIncome > 0 ? Math.round((kept / summary.totalIncome) * 100) : null;

  return (
    <>
      <Box sx={{ opacity: dimmed ? 0.85 : 1, transition: "opacity 0.28s ease" }}>
        <HeroBanner
          eyebrow={`Net balance · ${formatDate(dateRange.dateFrom)} – ${formatDate(dateRange.dateTo)}`}
          icon={AccountBalanceOutlinedIcon}
          tone={summary.netBalance >= 0 ? "primary" : "error"}
          value={summary.netBalance}
          format={formatCurrency}
          caption={
            keptShare === null
              ? "Add income to see how much you keep"
              : summary.netBalance >= 0
                ? `You kept ${keptShare}% of what came in ${keptShare >= 20 ? "🎉" : "👍"}`
                : "Spending outpaced income in this period"
          }
          aside={
            summary.totalIncome > 0 ? (
              <Box sx={{ width: { xs: "100%", md: 280 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Where the income went
                </Typography>
                <SegmentedBar
                  height={14}
                  legend="inline"
                  format={formatCurrency}
                  segments={[
                    { key: "spent", label: "Spent", value: spentOfIncome, color: palette[1] },
                    { key: "kept", label: "Kept", value: kept, color: palette[2] },
                  ]}
                />
              </Box>
            ) : null
          }
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
              gap: 1.5,
            }}
          >
            <DrillButton
              icon={TrendingUpOutlinedIcon}
              label="Income"
              value={formatCurrency(summary.totalIncome)}
              color={theme.palette.success.main}
              disabled={dimmed}
              onClick={() => setDetailKind("income")}
            />
            <DrillButton
              icon={TrendingDownOutlinedIcon}
              label="Expenses"
              value={formatCurrency(summary.totalExpenses)}
              color={theme.palette.error.main}
              disabled={dimmed}
              onClick={() => setDetailKind("expenses")}
            />
            <DrillButton
              icon={AccountBalanceOutlinedIcon}
              label="Net balance details"
              value={formatCurrency(summary.netBalance)}
              color={theme.palette.primary.main}
              disabled={dimmed}
              onClick={() => setDetailKind("balance")}
            />
          </Box>
        </HeroBanner>
      </Box>

      <BalanceSummaryDetailDrawer
        open={detailKind !== null}
        kind={detailKind}
        summary={summary}
        dateRange={dateRange}
        onClose={() => setDetailKind(null)}
      />
    </>
  );
}
