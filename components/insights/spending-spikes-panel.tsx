import {
  Alert,
  AlertTitle,
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { formatCurrency, formatMonth, formatPercent } from "@/lib/utils/format";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import type { SpendingSpike } from "@/lib/types";

type SpendingSpikesPanelProps = {
  spikes: SpendingSpike[];
};

export function SpendingSpikesPanel({ spikes }: SpendingSpikesPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: CARD_PADDING,
        border: 1,
        borderColor: "divider",
        height: "100%",
        minHeight: { xs: 280, sm: 320 },
      }}
    >
      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
        Spending Spikes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Months where expenses jumped 25%+ vs the prior month
      </Typography>

      {spikes.length === 0 ? (
        <Alert severity="success" variant="outlined">
          No unusual month-over-month spending spikes detected.
        </Alert>
      ) : (
        <Box>
          <Alert severity="warning" icon={<WarningAmberOutlinedIcon />} sx={{ mb: 2 }}>
            <AlertTitle>{spikes.length} spike{spikes.length === 1 ? "" : "s"} detected</AlertTitle>
            Review these periods for one-time purchases or budget adjustments.
          </Alert>
          <List dense disablePadding>
            {spikes.map((spike) => (
              <ListItem
                key={spike.month}
                disableGutters
                sx={{
                  py: 1.25,
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:last-child": { borderBottom: 0 },
                }}
              >
                <ListItemText
                  primary={formatMonth(spike.month)}
                  secondary={`${formatCurrency(spike.previousExpenses)} → ${formatCurrency(spike.expenses)}`}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                <Typography variant="body2" fontWeight={700} color="warning.main">
                  +{formatPercent(spike.changePercent)}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
}
