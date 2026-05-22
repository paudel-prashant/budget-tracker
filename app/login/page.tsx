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
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import { CARD_SHADOW } from "@/lib/layout-constants";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  return (
    <Card elevation={0} sx={{ boxShadow: CARD_SHADOW, borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <AccountBalanceWalletOutlinedIcon fontSize="large" />
          </Box>

          <Stack spacing={0.75}>
            <Typography variant="h5" fontWeight={700}>
              Finance Tracker
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in with Google to manage your budgets and transactions securely.
            </Typography>
          </Stack>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={() => signIn("google", { callbackUrl })}
            sx={{ py: 1.25, textTransform: "none", fontWeight: 600 }}
          >
            Continue with Google
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
        py: 4,
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
