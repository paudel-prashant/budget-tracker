"use client";

import { useState } from "react";
import { Box, Container, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import { TopNav } from "@/components/layout/top-nav";
import { Sidebar, DRAWER_WIDTH } from "@/components/layout/sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <TopNav
        drawerWidth={DRAWER_WIDTH}
        isMobile={isMobile}
        onMenuClick={() => setMobileOpen(true)}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: "100%", sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: "background.default",
        }}
      >
        <Toolbar />
        <Container
          maxWidth="lg"
          sx={{
            py: { xs: 2.5, sm: 3.5 },
            px: { xs: 2, sm: 3 },
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}
