"use client";

import { Box, Container, Toolbar } from "@mui/material";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { BottomNav } from "@/components/shared/layout/bottom-nav";
import { PageTransition } from "@/components/shared/layout/page-transition";
import { Sidebar } from "@/components/shared/layout/sidebar";
import { TopNav } from "@/components/shared/layout/top-nav";
import { QuickTransactionProvider } from "@/components/transactions/quick-transaction-provider";
import {
  APP_BAR_HEIGHT,
  BOTTOM_NAV_ADD_OVERFLOW,
  BOTTOM_NAV_HEIGHT,
  DRAWER_WIDTH,
  MOBILE_NAV_BREAKPOINT,
  PAGE_PADDING_X,
  PAGE_PADDING_Y,
} from "@/lib/config/layout-constants";

const MOBILE_MAIN_PADDING_BOTTOM = `calc(${BOTTOM_NAV_HEIGHT + BOTTOM_NAV_ADD_OVERFLOW}px + env(safe-area-inset-bottom, 0px))`;

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <QuickTransactionProvider>
      <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
        <Sidebar />

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            width: {
              xs: "100%",
              [MOBILE_NAV_BREAKPOINT]: `calc(100% - ${DRAWER_WIDTH}px)`,
            },
          }}
        >
          <TopNav drawerWidth={DRAWER_WIDTH} />

          <Toolbar
            sx={{
              minHeight: `${APP_BAR_HEIGHT}px !important`,
              height: APP_BAR_HEIGHT,
              flexShrink: 0,
            }}
          />

          <Box
            component="main"
            sx={{
              flex: 1,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              scrollPaddingBottom: {
                xs: MOBILE_MAIN_PADDING_BOTTOM,
                md: 0,
              },
            }}
          >
            <Container
              maxWidth="lg"
              disableGutters={false}
              sx={{
                width: "100%",
                mx: "auto",
                py: PAGE_PADDING_Y,
                pb: {
                  xs: MOBILE_MAIN_PADDING_BOTTOM,
                  sm: MOBILE_MAIN_PADDING_BOTTOM,
                  md: "calc(5rem + env(safe-area-inset-bottom, 0px))",
                },
                px: PAGE_PADDING_X,
              }}
            >
              <PageTransition>{children}</PageTransition>
            </Container>
          </Box>
        </Box>

        <BottomNav />
        <AssistantWidget />
        <PwaInstallPrompt />
      </Box>
    </QuickTransactionProvider>
  );
}
