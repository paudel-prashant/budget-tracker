"use client";

import { Box, Button, Typography, alpha, useTheme } from "@mui/material";
import CloudOffOutlinedIcon from "@mui/icons-material/CloudOffOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import Link from "next/link";
import { APP_NAME } from "@/lib/config/app";

export default function OfflinePage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "60dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 2,
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: "primary.main",
        }}
      >
        <CloudOffOutlinedIcon sx={{ fontSize: 40 }} />
      </Box>
      <Typography variant="h5" fontWeight={700}>
        You&apos;re offline
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
        {APP_NAME} can show your last cached dashboard and transactions if you visited them while
        online.
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center" }}>
        <Button
          variant="contained"
          startIcon={<RefreshOutlinedIcon />}
          onClick={() => window.location.reload()}
        >
          Try again
        </Button>
        <Button component={Link} href="/" variant="outlined">
          Dashboard
        </Button>
        <Button component={Link} href="/transactions" variant="outlined">
          Transactions
        </Button>
      </Box>
    </Box>
  );
}
