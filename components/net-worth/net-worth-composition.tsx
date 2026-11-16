"use client";

import { Box, Stack, Typography, useTheme } from "@mui/material";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { SegmentedBar } from "@/components/shared/ui/viz/segmented-bar";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { buildNetWorthComposition } from "@/lib/domain/net-worth-composition";
import { getCategoricalPalette } from "@/lib/theme/chart-styles";
import { chartTitleSx } from "@/lib/theme/typography";
import { formatCurrency } from "@/lib/utils/format";
import type { Asset, Liability, NetWorthAccountItem } from "@/lib/types";

type NetWorthCompositionProps = {
  assets: Asset[];
  liabilities: Liability[];
  accounts: NetWorthAccountItem[];
};

function Side({
  title,
  total,
  groups,
  emptyText,
}: {
  title: string;
  total: number;
  groups: ReturnType<typeof buildNetWorthComposition>["assets"];
  emptyText: string;
}) {
  const theme = useTheme();
  const palette = getCategoricalPalette(theme);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="subtitle1" fontWeight={800}>
          {formatCurrency(total)}
        </Typography>
      </Stack>
      {groups.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyText}
        </Typography>
      ) : (
        <SegmentedBar
          format={formatCurrency}
          height={16}
          segments={groups.map((group) => ({
            key: group.key,
            label: group.label,
            value: group.value,
            color: palette[group.slot],
            category: group.label,
          }))}
        />
      )}
    </Box>
  );
}

/** Side-by-side breakdown of what you own vs what you owe. */
export function NetWorthComposition({ assets, liabilities, accounts }: NetWorthCompositionProps) {
  const composition = buildNetWorthComposition(assets, liabilities, accounts);
  const totalAssets = composition.assets.reduce((sum, g) => sum + g.value, 0);
  const totalLiabilities = composition.liabilities.reduce((sum, g) => sum + g.value, 0);

  if (totalAssets === 0 && totalLiabilities === 0) return null;

  return (
    <SurfaceCard sx={{ p: CARD_PADDING }}>
      <Typography component="h2" sx={chartTitleSx}>
        What you own vs what you owe
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2.5 }}>
        Accounts and the items you&apos;ve added, grouped by type
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: { xs: 3, md: 5 },
        }}
      >
        <Side title="You own" total={totalAssets} groups={composition.assets} emptyText="No assets yet." />
        <Side
          title="You owe"
          total={totalLiabilities}
          groups={composition.liabilities}
          emptyText="Debt-free here 🎉"
        />
      </Box>
    </SurfaceCard>
  );
}
