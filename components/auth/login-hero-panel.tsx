"use client";

import Image from "next/image";
import { Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  LOGIN_HERO_IMAGE_PATH,
} from "@/lib/config/app";
import { LOGIN_FEATURES } from "@/lib/config/login-features";
import { BrandLogo } from "@/components/shared/brand-logo";
import { brandTitleSx, cardTitleSx } from "@/lib/theme/typography";

/** Intrinsic size of `public/images/budgetrax-login-hero.png` for Next.js Image. */
const HERO_WIDTH = 1024;
const HERO_HEIGHT = 512;

/**
 * Desktop login marketing — copy + hero artwork, theme typography only.
 */
export function LoginHeroPanel() {
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
        maxWidth: { md: 440, lg: 920, xl: 1020 },
        minHeight: "100%",
        my: "auto",
        display: "flex",
        flexDirection: { md: "column", lg: "row" },
        alignItems: "center",
        justifyContent: "center",
        gap: { md: 3, lg: 4 },
      }}
    >
      <Stack
        spacing={3}
        sx={{
          flex: { lg: "0 0 42%" },
          minWidth: 0,
          justifyContent: "center",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <BrandLogo
            size={48}
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

        <Box>
          <Typography variant="h3" component="h1" color="text.primary">
            Plan smarter. Spend better.{" "}
            <Box component="span" sx={{ color: "primary.main" }}>
              Achieve more.
            </Box>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {APP_DESCRIPTION}
          </Typography>
        </Box>

        <Stack spacing={1.5} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {LOGIN_FEATURES.map(({ icon: Icon, title, description }, index) => (
            <Stack
              key={title}
              component="li"
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                  bgcolor: alpha(featureColors[index], 0.14),
                  color: featureColors[index],
                }}
              >
                <Icon sx={{ fontSize: 22 }} />
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
      </Stack>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            borderRadius: { md: 3, lg: 4 },
            overflow: "hidden",
            lineHeight: 0,
            bgcolor: isLight
              ? alpha(theme.palette.primary.main, 0.06)
              : alpha(theme.palette.primary.main, 0.12),
            border: 1,
            borderColor: alpha(theme.palette.primary.main, isLight ? 0.14 : 0.28),
            boxShadow: isLight
              ? `0 20px 56px ${alpha(theme.palette.primary.main, 0.16)}, 0 4px 16px ${alpha(theme.palette.common.black, 0.06)}`
              : `0 24px 64px ${alpha(theme.palette.common.black, 0.45)}`,
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              pointerEvents: "none",
              boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, isLight ? 0.65 : 0.12)}`,
            },
          }}
        >
          <Image
            src={LOGIN_HERO_IMAGE_PATH}
            alt={`${APP_NAME} dashboard preview with income, expenses, budgets, and category insights`}
            width={HERO_WIDTH}
            height={HERO_HEIGHT}
            priority
            sizes="(max-width: 1200px) 50vw, 560px"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
