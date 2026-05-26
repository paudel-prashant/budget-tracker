"use client";

import { Fragment, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import { BrandLogo } from "@/components/shared/brand-logo";
import { brandTitleSx, cardTitleSx } from "@/lib/theme/typography";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/config/app";
import { LOGIN_FEATURES } from "@/lib/config/login-features";

function GoogleSignInButton() {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  return (
    <Button
      fullWidth
      variant="contained"
      size="large"
      startIcon={<GoogleIcon />}
      onClick={() => signIn("google", { callbackUrl })}
      sx={{
        py: 1.2,
        borderRadius: 2.5,
        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
        boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
      }}
    >
      Continue with Google
    </Button>
  );
}

const TRUST = [
  { icon: ShieldOutlinedIcon, label: "Private" },
  { icon: SpeedOutlinedIcon, label: "Fast setup" },
  { icon: DevicesOutlinedIcon, label: "Any device" },
] as const;

/**
 * Full-height mobile login:
 * 1) Brand + pitch at the top
 * 2) Sign-in immediately below (no scroll)
 * 3) Marketing panel grows to fill the rest of the screen (no floating card in empty space)
 */
export function LoginMobileScreen() {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  const featureColors = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  return (
    <Box
      sx={{
        width: "100%",
        height: "100dvh",
        maxHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ——— Top: brand + value prop (fixed, compact) ——— */}
      <Stack
        spacing={1.25}
        sx={{
          flexShrink: 0,
          px: 2.5,
          pt: "max(16px, env(safe-area-inset-top))",
          pb: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <BrandLogo
            size={42}
            priority
            sx={{
              borderRadius: 2.5,
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.28)}`,
            }}
          />
          <Box>
            <Typography variant="subtitle1" sx={brandTitleSx}>
              {APP_NAME}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {APP_TAGLINE}
            </Typography>
          </Box>
        </Stack>

        <Typography variant="h4" component="h1" color="text.primary">
          Plan smarter. Spend better.{" "}
          <Box component="span" sx={{ color: "primary.main" }}>
            Achieve more.
          </Box>
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {APP_DESCRIPTION}
        </Typography>
      </Stack>

      {/* ——— Middle: sign-in (priority — always near top, no scroll) ——— */}
      <Box
        sx={{
          flexShrink: 0,
          px: 2.5,
          pb: 1.5,
        }}
      >
        <Box
          sx={{
            p: 2.25,
            borderRadius: 3,
            bgcolor: isLight ? "#fff" : alpha(theme.palette.background.paper, 0.92),
            border: 1,
            borderColor: alpha(theme.palette.primary.main, 0.12),
            boxShadow: isLight
              ? `0 8px 28px ${alpha(theme.palette.primary.main, 0.12)}`
              : `0 8px 28px ${alpha(theme.palette.common.black, 0.35)}`,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Sign in to your dashboard
          </Typography>
          <Suspense
            fallback={
              <Box sx={{ display: "flex", justifyContent: "center", py: 1.25 }}>
                <CircularProgress size={24} />
              </Box>
            }
          >
            <GoogleSignInButton />
          </Suspense>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1.25 }}>
            <LockOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              Secure Google sign-in · your data is never sold
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* ——— Bottom: marketing fills ALL remaining height ——— */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          mx: 2.5,
          mb: "max(14px, env(safe-area-inset-bottom))",
          px: 2,
          py: 2,
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          border: 1,
          borderColor: alpha(theme.palette.primary.main, isLight ? 0.16 : 0.28),
          background: isLight
            ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`
            : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.22)} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
        }}
      >
        <Typography
          variant="overline"
          color="primary.main"
          sx={{ flexShrink: 0, mb: 1.5 }}
        >
          What you get
        </Typography>

        <Stack
          spacing={1.5}
          sx={{
            flex: 1,
            minHeight: 0,
            justifyContent: "space-evenly",
          }}
        >
          {LOGIN_FEATURES.map(({ icon: Icon, title, description }, index) => (
            <Stack key={title} direction="row" spacing={1.5} alignItems="flex-start">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                  bgcolor: alpha(featureColors[index], 0.15),
                  color: featureColors[index],
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body1" sx={cardTitleSx}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {description}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>

        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 0.5,
            pt: 1.5,
            mt: 1,
            borderTop: 1,
            borderColor: alpha(theme.palette.primary.main, 0.12),
          }}
        >
          {TRUST.map(({ icon: Icon, label }, index) => (
            <Fragment key={label}>
              {index > 0 && (
                <Typography component="span" variant="caption" color="text.disabled">
                  ·
                </Typography>
              )}
              <Stack direction="row" alignItems="center" spacing={0.4}>
                <Icon sx={{ fontSize: 14, color: "primary.main" }} />
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
              </Stack>
            </Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
