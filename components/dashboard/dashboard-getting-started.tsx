"use client";

import NextLink from "next/link";
import { Box, Button, Paper, Stack, Typography, useTheme } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { CARD_SHADOW } from "@/lib/layout-constants";

export function DashboardGettingStarted() {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        border: 1,
        borderColor: "divider",
        background:
          theme.palette.mode === "light"
            ? "linear-gradient(135deg, rgba(26, 115, 232, 0.08) 0%, #ffffff 60%)"
            : "linear-gradient(135deg, rgba(138, 180, 248, 0.12) 0%, #1a1d21 60%)",
        boxShadow: theme.palette.mode === "light" ? CARD_SHADOW : "none",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Get started with Finance Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
            Add your first transaction to populate summaries, charts, budgets, and insights.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexShrink: 0 }}>
          <Button
            component={NextLink}
            href="/transactions"
            variant="contained"
            startIcon={<AddOutlinedIcon />}
          >
            Add transaction
          </Button>
          <Button
            component={NextLink}
            href="/settings"
            variant="outlined"
            startIcon={<UploadFileOutlinedIcon />}
          >
            Import CSV
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
