"use client";

import { Alert, Box, CircularProgress, Stack } from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { HeroBanner } from "@/components/shared/ui/viz/hero-banner";
import { MiniStat } from "@/components/shared/ui/viz/mini-stat";
import { ForecastChart } from "@/components/forecast/forecast-chart";
import { ForecastEmptyStates } from "@/components/forecast/forecast-empty-states";
import { ForecastInsightsPanel } from "@/components/forecast/forecast-insights-panel";
import { ForecastTimeframeSelector } from "@/components/forecast/forecast-timeframe-selector";
import { ForecastTrendMetrics } from "@/components/forecast/forecast-trend-metrics";
import { ForecastUpcomingEvents } from "@/components/forecast/forecast-upcoming-events";
import { useForecast } from "@/hooks/use-forecast";
import { FORECAST_TIMEFRAME_DAYS, type ForecastEngineResult } from "@/lib/forecasting";
import { formatChartDate, formatCurrency } from "@/lib/utils/format";

type ForecastViewProps = {
  initialForecast?: ForecastEngineResult | null;
};

const CONFIDENCE_COPY = {
  HIGH: "High confidence 🔮",
  MEDIUM: "Medium confidence",
  LOW: "Low confidence: early days",
} as const;

export function ForecastView({ initialForecast = null }: ForecastViewProps) {
  const { forecast, timeframe, loading, error, changeTimeframe } = useForecast({
    initialTimeframe: "30d",
    initialData: initialForecast,
  });

  const showEmpty =
    forecast &&
    forecast.emptyStates.includes("no_history") &&
    forecast.currentBalance === 0;

  const days = FORECAST_TIMEFRAME_DAYS[timeframe];
  // Older cached responses predate these fields.
  const range = forecast?.projectedRange;
  const lowest = forecast?.lowestPoint ?? null;

  return (
    <PageStack>
      <PageHeader
        title="Cash Flow Forecast"
        description="Where your balance is heading, based on your history, recurring items, and spending trends."
        action={
          <ForecastTimeframeSelector
            value={timeframe}
            onChange={changeTimeframe}
            disabled={loading && !forecast}
          />
        }
      />

      {error && (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      )}

      {loading && !forecast ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : forecast ? (
        <Stack spacing={3} sx={{ opacity: loading ? 0.85 : 1, transition: "opacity 0.28s ease" }}>
          <HeroBanner
            eyebrow={`Projected balance in ${days} days`}
            icon={AutoGraphOutlinedIcon}
            tone={forecast.projectedBalance < 0 ? "error" : forecast.forecastChange >= 0 ? "success" : "warning"}
            value={forecast.projectedBalance}
            format={formatCurrency}
            delta={{
              label: `${forecast.forecastChange >= 0 ? "+" : "−"}${formatCurrency(Math.abs(forecast.forecastChange))} from today`,
              direction: forecast.forecastChange > 0 ? "up" : forecast.forecastChange < 0 ? "down" : "flat",
              sentiment: forecast.forecastChange > 0 ? "good" : forecast.forecastChange < 0 ? "bad" : "neutral",
            }}
            caption={
              range && range.high - range.low >= 1
                ? `Likely between ${formatCurrency(range.low)} and ${formatCurrency(range.high)}`
                : undefined
            }
            trend={forecast.forecastPoints.filter((p) => p.isProjected).map((p) => p.balance)}
            trendLabel="Projected path"
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              <MiniStat
                icon={AccountBalanceWalletOutlinedIcon}
                label="Today"
                value={formatCurrency(forecast.currentBalance)}
                color="primary.main"
              />
              <MiniStat
                icon={WaterDropOutlinedIcon}
                label={lowest ? `Lowest · ${formatChartDate(lowest.date)}` : "Lowest point"}
                value={lowest ? formatCurrency(lowest.balance) : "—"}
                color={lowest && lowest.balance < 0 ? "error.main" : "info.main"}
              />
              <MiniStat
                icon={VerifiedOutlinedIcon}
                label="Forecast quality"
                value={CONFIDENCE_COPY[forecast.confidence]}
                color={
                  forecast.confidence === "HIGH"
                    ? "success.main"
                    : forecast.confidence === "MEDIUM"
                      ? "warning.main"
                      : "error.main"
                }
              />
            </Box>
          </HeroBanner>

          {forecast.emptyStates.length > 0 && <ForecastEmptyStates states={forecast.emptyStates} />}

          {!showEmpty && <ForecastChart points={forecast.forecastPoints} loading={loading} />}

          <ForecastTrendMetrics forecast={forecast} loading={loading} />

          <ResponsiveColumns templateColumns={{ xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" }}>
            <ForecastUpcomingEvents events={forecast.upcomingEvents ?? []} />
            <ForecastInsightsPanel insights={forecast.insights} />
          </ResponsiveColumns>
        </Stack>
      ) : null}
    </PageStack>
  );
}
