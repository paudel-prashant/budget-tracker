"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { AppThemeProvider } from "@/lib/theme-context";
import { SnackbarProvider } from "@/components/providers/snackbar-provider";

type MuiProviderProps = {
  children: React.ReactNode;
};

export function MuiProvider({ children }: MuiProviderProps) {
  return (
    <AppRouterCacheProvider>
      <AppThemeProvider>
        <SnackbarProvider>{children}</SnackbarProvider>
      </AppThemeProvider>
    </AppRouterCacheProvider>
  );
}
