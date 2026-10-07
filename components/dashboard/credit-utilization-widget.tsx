"use client";

import { Box, Stack, Typography, alpha } from "@mui/material";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import { WidgetInlineLink, WidgetLinkButton } from "@/components/dashboard/widget-actions";
import { UtilizationMeter, UtilizationStatus } from "@/components/accounts/utilization-meter";
import { UTILIZATION_FAIR_THRESHOLD } from "@/lib/domain/account-net-worth";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { CreditCardSummary } from "@/lib/types";

type CreditUtilizationWidgetProps = {
  summary: CreditCardSummary;
};

/**
 * Credit card utilization: the overall figure (what credit scores weigh) as the headline,
 * then one meter per card, highest utilization first.
 */
export function CreditUtilizationWidget({ summary }: CreditUtilizationWidgetProps) {
  const { cards, overallUtilization, totalOwed, totalLimit } = summary;

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={(theme) => ({
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
            })}
          >
            <CreditCardOutlinedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Credit utilization
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Keep it under {UTILIZATION_FAIR_THRESHOLD}% of your limits
            </Typography>
          </Box>
        </Stack>
        <WidgetLinkButton href="/accounts">Manage cards</WidgetLinkButton>
      </Stack>

      {cards.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No credit cards yet. <WidgetInlineLink href="/accounts">Add a card</WidgetInlineLink> with
          its limit to see how much of your available credit you&apos;re using.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {overallUtilization !== null ? (
            <Stack direction="row" alignItems="baseline" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
              <Typography variant="h4" fontWeight={700}>
                {formatPercent(overallUtilization)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(totalOwed)} owed of {formatCurrency(totalLimit)} total limit
              </Typography>
              <UtilizationStatus percent={overallUtilization} />
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(totalOwed)} owed.{" "}
              <WidgetInlineLink href="/accounts">Add credit limits</WidgetInlineLink> to see
              utilization.
            </Typography>
          )}

          {cards.map((card) => (
            <Box key={card.id}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                <Typography variant="body2" fontWeight={600} noWrap sx={{ minWidth: 0 }}>
                  {card.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                  {card.utilization !== null
                    ? `${formatPercent(card.utilization)} · ${formatCurrency(card.available ?? 0)} available`
                    : `${formatCurrency(card.owed)} owed · no limit set`}
                </Typography>
              </Stack>
              {card.creditLimit !== null && card.utilization !== null && (
                <UtilizationMeter
                  owed={card.owed}
                  creditLimit={card.creditLimit}
                  utilization={card.utilization}
                  compact
                />
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
