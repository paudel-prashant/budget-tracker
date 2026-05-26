"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Alert, Box, Button, Fade, useTheme } from "@mui/material";

/** Fixed host id — also styled in globals.css so position never drifts. */
export const APP_TOAST_HOST_ID = "app-toast-host";

type SnackbarSeverity = "success" | "error" | "info";

/** 2–3s auto-dismiss (errors slightly longer so messages can be read). */
const AUTO_HIDE_MS: Record<SnackbarSeverity, number> = {
  success: 2800,
  info: 3000,
  error: 4000,
};

export type SnackbarAction = {
  label: string;
  onClick: () => void;
};

export type SnackbarOptions = {
  autoHideMs?: number;
  action?: SnackbarAction;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
  autoHideMs?: number;
  action?: SnackbarAction;
};

type SnackbarContextValue = {
  showSuccess: (message: string, options?: SnackbarOptions) => void;
  showError: (message: string, options?: SnackbarOptions) => void;
  showInfo: (message: string, options?: SnackbarOptions) => void;
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

type AppToastProps = {
  snackbar: SnackbarState;
  onClose: () => void;
};

function AppToast({ snackbar, onClose }: AppToastProps) {
  const theme = useTheme();
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!snackbar.open) {
      clearHideTimer();
      return;
    }

    clearHideTimer();
    const duration = snackbar.autoHideMs ?? AUTO_HIDE_MS[snackbar.severity];
    hideTimerRef.current = setTimeout(() => {
      onClose();
    }, duration);

    return clearHideTimer;
  }, [
    snackbar.open,
    snackbar.message,
    snackbar.severity,
    snackbar.autoHideMs,
    onClose,
    clearHideTimer,
  ]);

  return (
    <Fade in={snackbar.open} timeout={{ enter: 200, exit: 150 }}>
      <Box
        component="div"
        sx={{
          width: "100%",
          maxWidth: 420,
          pointerEvents: "auto",
        }}
      >
        <Alert
          onClose={snackbar.action ? undefined : onClose}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
          action={
            snackbar.action ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  snackbar.action?.onClick();
                  onClose();
                }}
                sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
              >
                {snackbar.action.label}
              </Button>
            ) : undefined
          }
          sx={{
            width: "100%",
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            alignItems: "center",
          }}
        >
          {snackbar.message}
        </Alert>
      </Box>
    </Fade>
  );
}

function ToastPortal({ snackbar, onClose }: AppToastProps) {
  const theme = useTheme();

  if (!snackbar.open) {
    return null;
  }

  return createPortal(
    <div
      id={APP_TOAST_HOST_ID}
      role="presentation"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        padding: "24px 16px",
        paddingBottom: "max(24px, env(safe-area-inset-bottom, 0px))",
        zIndex: theme.zIndex.snackbar,
        pointerEvents: "none",
        boxSizing: "border-box",
      }}
    >
      <AppToast snackbar={snackbar} onClose={onClose} />
    </div>,
    document.body
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

  const handleClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const showMessage = useCallback(
    (message: string, severity: SnackbarSeverity, options?: SnackbarOptions) => {
      setSnackbar({
        open: true,
        message,
        severity,
        autoHideMs: options?.autoHideMs,
        action: options?.action,
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      showSuccess: (message: string, options?: SnackbarOptions) =>
        showMessage(message, "success", options),
      showError: (message: string, options?: SnackbarOptions) =>
        showMessage(message, "error", options),
      showInfo: (message: string, options?: SnackbarOptions) =>
        showMessage(message, "info", options),
    }),
    [showMessage]
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {mounted ? <ToastPortal snackbar={snackbar} onClose={handleClose} /> : null}
    </SnackbarContext.Provider>
  );
}
