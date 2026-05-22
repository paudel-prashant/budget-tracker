import { Box, Typography } from "@mui/material";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";

type ChartEmptyStateProps = {
  message?: string;
  compact?: boolean;
};

export function ChartEmptyState({
  message = "No data yet",
  compact = false,
}: ChartEmptyStateProps) {
  if (compact) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          py: 2,
          px: 2,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          borderStyle: "dashed",
          bgcolor: "background.default",
        }}
      >
        <BarChartOutlinedIcon sx={{ fontSize: 22, color: "text.disabled" }} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: 3,
        px: 2,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        borderStyle: "dashed",
        bgcolor: "background.default",
      }}
    >
      <BarChartOutlinedIcon sx={{ fontSize: 32, color: "text.disabled", mb: 1 }} />
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 260 }}>
        {message}
      </Typography>
    </Box>
  );
}
