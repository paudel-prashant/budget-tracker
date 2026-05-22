"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import { CARD_SHADOW } from "@/lib/layout-constants";

function LoginForm() {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  return (
    <Card
      elevation={0}
      sx={{
        boxShadow: CARD_SHADOW,
        borderRadius: 4,
        border: 1,
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: { xs: 3, sm: 4 },
          pt: 4,
          pb: 3,
          textAlign: "center",
          background: `linear-gradient(160deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, transparent 55%)`,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: "primary.contrastText",
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.45)}`,
          }}
        >
          <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h5" component="h1">
          Finance Tracker
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, maxWidth: 300, mx: "auto" }}>
          Sign in with Google to manage budgets, transactions, and insights securely.
        </Typography>
      </Box>
      <CardContent sx={{ p: { xs: 3, sm: 4 }, pt: 3.5 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={() => signIn("google", { callbackUrl })}
          sx={{
            py: 1.35,
            fontWeight: 600,
            borderRadius: 2.5,
          }}
        >
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2.5, sm: 3 },
        py: { xs: 4, sm: 5 },
        background:
          theme.palette.mode === "light"
            ? `radial-gradient(ellipse 70% 60% at 50% -20%, ${alpha(theme.palette.primary.main, 0.18)}, transparent), #f1f5f9`
            : `radial-gradient(ellipse 70% 50% at 50% 0%, ${alpha(theme.palette.primary.main, 0.2)}, transparent), #0b0f19`,
      }}
    >
      <Container maxWidth="xs">
        <Suspense
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          }
        >
          <LoginForm />
        </Suspense>
      </Container>
    </Box>
  );
}
