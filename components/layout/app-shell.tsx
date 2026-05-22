"use client";

import { useState } from "react";
import { Box, Container, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import { TopNav } from "@/components/layout/top-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { APP_BAR_HEIGHT, DRAWER_WIDTH } from "@/lib/layout-constants";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          width: { xs: "100%", sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <TopNav
          drawerWidth={DRAWER_WIDTH}
          isMobile={isMobile}
          onMenuClick={() => setMobileOpen(true)}
        />

        <Toolbar
          sx={{ minHeight: `${APP_BAR_HEIGHT}px !important`, height: APP_BAR_HEIGHT, flexShrink: 0 }}
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Container
            maxWidth="lg"
            disableGutters={false}
            sx={{
              width: "100%",
              mx: "auto",
              py: { xs: 2, sm: 3 },
              pb: { xs: 3, sm: 4 },
              px: { xs: 2, sm: 3 },
            }}
          >
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
