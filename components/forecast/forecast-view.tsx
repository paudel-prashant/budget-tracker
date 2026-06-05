"use client";

import { Alert, Box, CircularProgress, Stack } from "@mui/material";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { SectionPanel } from "@/components/shared/ui/section-panel";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { ForecastChart } from "@/components/forecast/forecast-chart";
import { ForecastEmptyStates } from "@/components/forecast/forecast-empty-states";
import { ForecastInsightsPanel } from "@/components/forecast/forecast-insights-panel";
import { ForecastSummaryCards } from "@/components/forecast/forecast-summary-cards";
import { ForecastTimeframeSelector } from "@/components/forecast/forecast-timeframe-selector";
import { ForecastTrendMetrics } from "@/components/forecast/forecast-trend-metrics";
import { useForecast } from "@/hooks/use-forecast";
import type { ForecastEngineResult } from "@/lib/forecasting";

type ForecastViewProps = {
  initialForecast?: ForecastEngineResult | null;
};

export function ForecastView({ initialForecast = null }: ForecastViewProps) {
  const { forecast, timeframe, loading, error, changeTimeframe } = useForecast({
    initialTimeframe: "30d",
    initialData: initialForecast,
  });

  const showEmpty =
    forecast &&
    forecast.emptyStates.includes("no_history") &&
    forecast.currentBalance === 0;

  return (
    <PageStack>
      <PageHeader
        title="Cash Flow Forecast"
        description="Project future balances using your transaction history, recurring items, and spending trends."
      />

      <SectionPanel sx={{ p: CARD_PADDING }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="flex-end"
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <ForecastTimeframeSelector
            value={timeframe}
            onChange={changeTimeframe}
            disabled={loading && !forecast}
          />
        </Stack>

        {error && (
          <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && !forecast ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : forecast ? (
          <Stack spacing={3}>
            <ForecastSummaryCards
              currentBalance={forecast.currentBalance}
              projectedBalance={forecast.projectedBalance}
              forecastChange={forecast.forecastChange}
              confidence={forecast.confidence}
              dimmed={loading}
            />

            <ForecastTrendMetrics forecast={forecast} loading={loading} />

            {forecast.emptyStates.length > 0 && (
              <ForecastEmptyStates states={forecast.emptyStates} />
            )}

            {!showEmpty && (
              <ForecastChart points={forecast.forecastPoints} loading={loading} />
            )}

            <Box>
              <ForecastInsightsPanel insights={forecast.insights} />
            </Box>
          </Stack>
        ) : null}
      </SectionPanel>
    </PageStack>
  );
}
