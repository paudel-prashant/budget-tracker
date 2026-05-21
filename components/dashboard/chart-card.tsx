import { Box, Paper, Typography } from "@mui/material";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
};

export function ChartCard({
  title,
  subtitle,
  isEmpty = false,
  emptyMessage = "No data to display yet.",
  children,
}: ChartCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        border: 1,
        borderColor: "divider",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          {subtitle}
        </Typography>
      )}
      {!subtitle && <Box sx={{ mb: 2 }} />}
      {isEmpty ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 6, textAlign: "center", flex: 1 }}
        >
          {emptyMessage}
        </Typography>
      ) : (
        <Box sx={{ width: "100%", height: { xs: 260, sm: 300 }, flex: 1 }}>{children}</Box>
      )}
    </Paper>
  );
}
