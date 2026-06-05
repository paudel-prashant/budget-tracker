"use client";

import {
  Alert,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import type { ForecastInsight, ForecastInsightSeverity } from "@/lib/forecasting";

type ForecastInsightsPanelProps = {
  insights: ForecastInsight[];
};

function severityToAlert(severity: ForecastInsightSeverity) {
  switch (severity) {
    case "success":
      return "success" as const;
    case "warning":
      return "warning" as const;
    default:
      return "info" as const;
  }
}

export function ForecastInsightsPanel({ insights }: ForecastInsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Insights will appear as more transaction history becomes available.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {insights.map((item) => (
        <Alert
          key={item.id}
          severity={severityToAlert(item.severity)}
          variant="outlined"
          icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
        >
          {item.message}
        </Alert>
      ))}
    </Stack>
  );
}
