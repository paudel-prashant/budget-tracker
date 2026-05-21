import { Box, Typography } from "@mui/material";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        mb: { xs: 2.5, sm: 3.5 },
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "flex-start" },
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" component="h1" gutterBottom={!!description}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
            {description}
          </Typography>
        )}
      </Box>
      {action && (
        <Box sx={{ flexShrink: 0, width: { xs: "100%", sm: "auto" } }}>{action}</Box>
      )}
    </Box>
  );
}
