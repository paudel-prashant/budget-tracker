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
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { LoginHeroPanel } from "@/components/auth/login-hero-panel";
import { APP_NAME } from "@/lib/config/app";
import { CARD_SHADOW } from "@/lib/config/layout-constants";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  return (
    <Stack spacing={3} sx={{ width: "100%", maxWidth: 400 }}>
      <Box>
        <Typography variant="h5" component="h2" fontWeight={700}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Sign in to open your dashboard and pick up where you left off.
        </Typography>
      </Box>

      <Card
        elevation={0}
        sx={{
          boxShadow: CARD_SHADOW,
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 3.5 } }}>
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
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 2.5 }}>
            <LockOutlinedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15 }} />
            <Typography variant="caption" color="text.secondary" lineHeight={1.5}>
              We use Google sign-in only. Your financial data stays in your {APP_NAME} account and
              is never sold.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default function LoginPage() {
  const theme = useTheme();

  const pageBackground =
    theme.palette.mode === "light"
      ? `radial-gradient(ellipse 80% 70% at 0% 0%, ${alpha(theme.palette.primary.main, 0.12)}, transparent 55%), #f1f5f9`
      : `radial-gradient(ellipse 70% 60% at 0% 0%, ${alpha(theme.palette.primary.main, 0.18)}, transparent 50%), #0b0f19`;

  const panelDivider = {
    borderColor: "divider",
    borderTop: { xs: 1, md: 0 },
    borderLeft: { xs: 0, md: 1 },
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        bgcolor: "background.default",
        background: pageBackground,
      }}
    >
      <Box
        component="section"
        aria-label={`About ${APP_NAME}`}
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 4, md: 5, lg: 7 },
          py: { xs: 5, sm: 6, md: 4 },
        }}
      >
        <LoginHeroPanel />
      </Box>

      <Box
        component="section"
        aria-label="Sign in"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 4, md: 5, lg: 7 },
          py: { xs: 5, sm: 6, md: 4 },
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "light" ? 0.65 : 0.4),
          backdropFilter: "blur(12px)",
          ...panelDivider,
        }}
      >
        <Suspense
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          }
        >
          <LoginForm />
        </Suspense>
      </Box>
    </Box>
  );
}
