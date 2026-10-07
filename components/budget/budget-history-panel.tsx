"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import { SectionPanel } from "@/components/shared/ui/section-panel";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { formatCurrency, formatMonthYear } from "@/lib/utils/format";
import type { BudgetHistoryMonth } from "@/lib/types";

type MonthYear = { month: number; year: number };

type BudgetHistoryPanelProps = {
  history: BudgetHistoryMonth[];
  selected: MonthYear;
  copying: boolean;
  onView: (value: MonthYear) => void;
  onCopy: (from: BudgetHistoryMonth) => void;
};

const INITIAL_VISIBLE = 6;
const MAX_CATEGORY_CHIPS = 5;

export function BudgetHistoryPanel({
  history,
  selected,
  copying,
  onView,
  onCopy,
}: BudgetHistoryPanelProps) {
  const [showAll, setShowAll] = useState(false);

  const entries = history.filter(
    (entry) => entry.month !== selected.month || entry.year !== selected.year
  );

  if (entries.length === 0) return null;

  const visible = showAll ? entries : entries.slice(0, INITIAL_VISIBLE);
  const selectedLabel = formatMonthYear(selected.month, selected.year);

  return (
    <SectionPanel sx={{ mt: 3 }}>
      <Box sx={{ p: CARD_PADDING }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <HistoryOutlinedIcon fontSize="small" color="action" />
          <Typography variant="h6">Budget history</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Reuse a past month&apos;s budgets for {selectedLabel}. Categories already budgeted in{" "}
          {selectedLabel} are kept as-is.
        </Typography>
      </Box>
      <Divider />
      {visible.map((entry, index) => {
        const extraCategories = entry.categories.length - MAX_CATEGORY_CHIPS;

        return (
          <Box key={`${entry.year}-${entry.month}`}>
            {index > 0 && <Divider />}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1.5, sm: 2 }}
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{ px: CARD_PADDING, py: 2 }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {formatMonthYear(entry.month, entry.year)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {entry.budgetCount} {entry.budgetCount === 1 ? "budget" : "budgets"} ·{" "}
                  {formatCurrency(entry.totalLimit)} total
                </Typography>
                <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1, flexWrap: "wrap" }}>
                  {entry.categories.slice(0, MAX_CATEGORY_CHIPS).map((category) => (
                    <Chip key={category} label={category} size="small" variant="outlined" />
                  ))}
                  {extraCategories > 0 && <Chip label={`+${extraCategories}`} size="small" />}
                </Stack>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Button size="small" onClick={() => onView(entry)}>
                  View
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyOutlinedIcon fontSize="small" />}
                  disabled={copying}
                  onClick={() => onCopy(entry)}
                >
                  Copy to {selectedLabel}
                </Button>
              </Stack>
            </Stack>
          </Box>
        );
      })}
      {entries.length > INITIAL_VISIBLE && (
        <>
          <Divider />
          <Box sx={{ px: CARD_PADDING, py: 1 }}>
            <Button size="small" onClick={() => setShowAll((prev) => !prev)}>
              {showAll ? "Show less" : `Show all ${entries.length} months`}
            </Button>
          </Box>
        </>
      )}
    </SectionPanel>
  );
}
