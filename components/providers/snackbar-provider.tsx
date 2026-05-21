"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Alert, Snackbar } from "@mui/material";

type SnackbarSeverity = "success" | "error" | "info";

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

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

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

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
