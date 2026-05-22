import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrendingFlatOutlinedIcon from "@mui/icons-material/TrendingFlatOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import type { TrendDirection } from "@/lib/types";

type InsightCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: SvgIconComponent;
  iconColor?: string;
  trend?: TrendDirection;
  trendLabel?: string;
  trendPositiveIsGood?: boolean;
};

function TrendIndicator({
  trend,
  label,
  positiveIsGood = true,
}: {
  trend: TrendDirection;
  label?: string;
  positiveIsGood?: boolean;
}) {
  if (!label && trend === "flat") return null;

  const isUp = trend === "up";
  const isGood = positiveIsGood ? isUp : !isUp;
  const color = trend === "flat" ? "text.secondary" : isGood ? "success.main" : "error.main";

  const Icon =
    trend === "up"
      ? TrendingUpOutlinedIcon
      : trend === "down"
        ? TrendingDownOutlinedIcon
        : TrendingFlatOutlinedIcon;

  return (
    <Chip
      icon={<Icon sx={{ fontSize: "16px !important", color: `${color} !important` }} />}
      label={label ?? (trend === "flat" ? "Stable" : trend === "up" ? "Up" : "Down")}
      size="small"
      variant="outlined"
      sx={{
        borderColor: color,
        color,
        "& .MuiChip-icon": { ml: 0.5 },
      }}
    />
  );
}

export function InsightCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "primary.main",
  trend,
  trendLabel,
  trendPositiveIsGood = true,
}: InsightCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        border: 1,
        borderColor: "divider",
        height: "100%",
        minHeight: { xs: 148, sm: 160 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: "action.hover",
            flexShrink: 0,
          }}
        >
          <Icon sx={{ color: iconColor, fontSize: 24 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700} noWrap>
            {value}
          </Typography>
        </Box>
      </Stack>

      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: trend || trendLabel ? 1.5 : 0 }}>
          {subtitle}
        </Typography>
      )}

      {trend && (
        <Box sx={{ mt: "auto" }}>
          <TrendIndicator
            trend={trend}
            label={trendLabel}
            positiveIsGood={trendPositiveIsGood}
          />
        </Box>
      )}
    </Paper>
  );
}
