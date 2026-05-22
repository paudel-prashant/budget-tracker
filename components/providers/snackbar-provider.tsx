"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Alert, Snackbar, useTheme } from "@mui/material";

type SnackbarSeverity = "success" | "error" | "info";

const AUTO_HIDE_MS: Record<SnackbarSeverity, number> = {
  success: 2500,
  info: 3000,
  error: 5000,
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
};

type SnackbarContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }
  return context;
}

type SnackbarProviderProps = {
  children: ReactNode;
};

function AppSnackbar({
  snackbar,
  onClose,
}: {
  snackbar: SnackbarState;
  onClose: (reason?: string) => void;
}) {
  const theme = useTheme();

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={AUTO_HIDE_MS[snackbar.severity]}
      onClose={(_event, reason) => onClose(reason)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      disablePortal
      sx={{
        position: "fixed",
        left: "50%",
        right: "auto",
        top: "auto",
        bottom: { xs: 20, sm: 28 },
        transform: "translateX(-50%)",
        zIndex: theme.zIndex.snackbar,
      }}
    >
      <Alert
        onClose={() => onClose()}
        severity={snackbar.severity}
        variant="filled"
        sx={{
          width: "100%",
          maxWidth: { xs: "calc(100vw - 32px)", sm: 420 },
          borderRadius: 2,
          boxShadow: theme.shadows[6],
        }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const showMessage = useCallback((message: string, severity: SnackbarSeverity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const value = useMemo(
    () => ({
      showSuccess: (message: string) => showMessage(message, "success"),
      showError: (message: string) => showMessage(message, "error"),
      showInfo: (message: string) => showMessage(message, "info"),
    }),
    [showMessage]
  );

  const handleClose = (reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const snackbarElement = <AppSnackbar snackbar={snackbar} onClose={handleClose} />;

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {mounted && typeof document !== "undefined"
        ? createPortal(snackbarElement, document.body)
        : null}
    </SnackbarContext.Provider>
  );
}
