"use client";

import { Box, Stack, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import { SEQUENTIAL_BLUE } from "@/lib/theme/chart-styles";

type CalendarHeatmapProps = {
  /** YYYY-MM */
  month: string;
  days: Array<{ date: string; amount: number }>;
  format: (value: number) => string;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Five ordinal bins from the blue ramp; the lightest still clears 2:1 on white. */
const BIN_STEPS_LIGHT = [SEQUENTIAL_BLUE[3], SEQUENTIAL_BLUE[5], SEQUENTIAL_BLUE[7], SEQUENTIAL_BLUE[9], SEQUENTIAL_BLUE[11]];
const BIN_STEPS_DARK = [SEQUENTIAL_BLUE[10], SEQUENTIAL_BLUE[8], SEQUENTIAL_BLUE[6], SEQUENTIAL_BLUE[4], SEQUENTIAL_BLUE[2]];

/** Quantile thresholds over the days that had spending. */
function binThresholds(values: number[]): number[] {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  return [0.2, 0.4, 0.6, 0.8].map((q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]);
}

/** A month calendar where each day is shaded by how much was spent. */
export function CalendarHeatmap({ month, days, format }: CalendarHeatmapProps) {
  const theme = useTheme();
  const steps = theme.palette.mode === "dark" ? BIN_STEPS_DARK : BIN_STEPS_LIGHT;
  const [year, monthIndex] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  // Monday-first offset of the 1st.
  const offset = (new Date(year, monthIndex - 1, 1).getDay() + 6) % 7;

  const byDay = new Map<number, number>();
  for (const entry of days) {
    const day = Number(entry.date.slice(8, 10));
    if (entry.date.startsWith(month)) byDay.set(day, (byDay.get(day) ?? 0) + entry.amount);
  }
  const thresholds = binThresholds([...byDay.values()]);
  const binFor = (amount: number) => {
    if (amount <= 0) return -1;
    let bin = 0;
    while (bin < thresholds.length && amount > thresholds[bin]) bin += 1;
    return Math.min(bin, steps.length - 1);
  };

  const cells: Array<number | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const busiest = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
  const quietDays = daysInMonth - [...byDay.values()].filter((v) => v > 0).length;

  return (
    <Box>
      <Box
        role="grid"
        aria-label={`Daily spending calendar for ${month}`}
        sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: { xs: 0.5, sm: 0.75 } }}
      >
        {WEEKDAYS.map((day) => (
          <Typography key={day} variant="caption" color="text.secondary" sx={{ textAlign: "center", fontWeight: 600 }}>
            {day}
          </Typography>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <Box key={`pad-${index}`} />;
          const amount = byDay.get(day) ?? 0;
          const bin = binFor(amount);
          const fill = bin < 0 ? alpha(theme.palette.text.primary, 0.05) : steps[bin];
          // Deeper shades need white text; the lightest need dark text.
          const whiteText = theme.palette.mode === "light" ? bin >= 2 : bin <= 2;
          return (
            <Tooltip key={day} title={amount > 0 ? `${month}-${String(day).padStart(2, "0")}: ${format(amount)}` : `Day ${day}: no spending`}>
              <Box
                role="gridcell"
                aria-label={`Day ${day}: ${amount > 0 ? format(amount) : "no spending"}`}
                sx={{
                  aspectRatio: "1 / 1",
                  maxHeight: 54,
                  borderRadius: 1.25,
                  bgcolor: fill,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  p: 0.5,
                  transition: "transform 120ms ease",
                  "&:hover": { transform: "scale(1.08)" },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: 10,
                    lineHeight: 1,
                    fontWeight: 600,
                    color: bin < 0 ? "text.secondary" : whiteText ? "#ffffff" : "#0b1220",
                  }}
                >
                  {day}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        sx={{ mt: 1.5 }}
      >
        <Typography variant="caption" color="text.secondary">
          {busiest ? `Busiest day: ${month}-${String(busiest[0]).padStart(2, "0")} (${format(busiest[1])})` : "No spending yet"}
          {quietDays > 0 ? ` · ${quietDays} no-spend ${quietDays === 1 ? "day" : "days"} 🎉` : ""}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            Less
          </Typography>
          {steps.map((step) => (
            <Box key={step} sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: step }} />
          ))}
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            More
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
