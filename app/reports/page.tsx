import { Paper, Typography } from "@mui/material";
import { PageHeader } from "@/components/ui/page-header";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Analyze spending trends and financial insights."
      />
      <Paper
        elevation={0}
        sx={{
          p: 4,
          border: 1,
          borderColor: "divider",
          textAlign: "center",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Reports and analytics charts will be added when data is available.
        </Typography>
      </Paper>
    </>
  );
}
