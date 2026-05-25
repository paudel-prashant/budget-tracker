"use client";

import { createTheme, type PaletteMode, type ThemeOptions } from "@mui/material/styles";
import {
  CARD_PADDING,
  FORM_STACK_SPACING,
  PAGE_PADDING_X,
  PAGE_PADDING_Y,
  SECTION_GAP,
} from "@/lib/config/layout-constants";
import { fontFamilyStack } from "@/lib/theme/fonts";

const fontStack = fontFamilyStack;

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          primary: { main: "#4f46e5", light: "#818cf8", dark: "#3730a3", contrastText: "#fff" },
          secondary: { main: "#64748b", light: "#94a3b8", dark: "#475569" },
          success: { main: "#059669", light: "#34d399", dark: "#047857" },
          error: { main: "#dc2626", light: "#f87171", dark: "#b91c1c" },
          warning: { main: "#d97706", light: "#fbbf24", dark: "#b45309" },
          info: { main: "#0ea5e9", light: "#38bdf8", dark: "#0284c7" },
          background: { default: "#f1f5f9", paper: "#ffffff" },
          divider: "rgba(15, 23, 42, 0.08)",
          text: { primary: "#0f172a", secondary: "#64748b" },
        }
      : {
          primary: { main: "#818cf8", light: "#a5b4fc", dark: "#6366f1", contrastText: "#0f172a" },
          secondary: { main: "#94a3b8", light: "#cbd5e1", dark: "#64748b" },
          success: { main: "#34d399", light: "#6ee7b7", dark: "#10b981" },
          error: { main: "#f87171", light: "#fca5a5", dark: "#ef4444" },
          warning: { main: "#fbbf24", light: "#fcd34d", dark: "#f59e0b" },
          info: { main: "#38bdf8", light: "#7dd3fc", dark: "#0ea5e9" },
          background: { default: "#0b0f19", paper: "#151b28" },
          divider: "rgba(148, 163, 184, 0.12)",
          text: { primary: "#f1f5f9", secondary: "#94a3b8" },
        }),
  },
  typography: {
    fontFamily: fontStack,
    fontSize: 16,
    fontWeightLight: 400,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontWeight: 700,
      fontSize: "2rem",
      lineHeight: 1.2,
      letterSpacing: "-0.035em",
    },
    h2: {
      fontWeight: 700,
      fontSize: "1.75rem",
      lineHeight: 1.25,
      letterSpacing: "-0.03em",
    },
    h3: {
      fontWeight: 700,
      fontSize: "1.5rem",
      lineHeight: 1.3,
      letterSpacing: "-0.025em",
    },
    h4: {
      fontWeight: 700,
      fontSize: "1.625rem",
      lineHeight: 1.25,
      letterSpacing: "-0.03em",
    },
    h5: {
      fontWeight: 700,
      fontSize: "1.25rem",
      lineHeight: 1.35,
      letterSpacing: "-0.02em",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.0625rem",
      lineHeight: 1.4,
      letterSpacing: "-0.015em",
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: 1.5,
      letterSpacing: "-0.01em",
    },
    subtitle2: {
      fontWeight: 600,
      fontSize: "0.6875rem",
      lineHeight: 1.4,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.65,
      letterSpacing: "-0.011em",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
      letterSpacing: "-0.008em",
    },
    caption: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
      letterSpacing: "0.01em",
      fontWeight: 500,
    },
    overline: {
      fontSize: "0.6875rem",
      fontWeight: 700,
      lineHeight: 1.4,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
    },
    button: {
      textTransform: "none" as const,
      fontWeight: 600,
      fontSize: "0.9375rem",
      letterSpacing: "-0.01em",
    },
  },
  shape: { borderRadius: 12 },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: "smooth",
          overflowX: "hidden",
        },
        "h1, h2, h3, h4, h5, h6": {
          margin: 0,
        },
        p: {
          margin: 0,
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          h1: "h1",
          h2: "h2",
          h3: "h3",
          h4: "h1",
          h5: "h2",
          h6: "h3",
          subtitle1: "p",
          subtitle2: "p",
          body1: "p",
          body2: "p",
        },
      },
      styleOverrides: {
        root: {
          fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
        },
        gutterBottom: {
          marginBottom: "0.6em",
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 0,
          paddingRight: 0,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          backdropFilter: "blur(12px)",
          backgroundColor:
            mode === "light" ? "rgba(255, 255, 255, 0.88)" : "rgba(21, 27, 40, 0.92)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 1,
          borderColor: "divider",
          backgroundImage: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: "background-color 0.15s ease, color 0.15s ease",
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: "0.9rem",
          fontWeight: 500,
          letterSpacing: "-0.01em",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 22,
          paddingBlock: 10,
          lineHeight: 1.4,
        },
        sizeSmall: {
          fontSize: "0.8125rem",
          paddingInline: 14,
          paddingBlock: 6,
        },
        sizeLarge: {
          fontSize: "1rem",
          paddingInline: 26,
          paddingBlock: 12,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
          },
        },
        outlined: {
          borderWidth: 1.5,
          "&:hover": { borderWidth: 1.5 },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 0.12s ease",
          "&:last-child td": { borderBottom: 0 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: "0.6875rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
          color: mode === "light" ? "#64748b" : "#94a3b8",
          bgcolor: mode === "light" ? "#f8fafc" : "rgba(148, 163, 184, 0.06)",
          borderBottom: 1,
          borderColor: "divider",
          paddingTop: 14,
          paddingBottom: 14,
        },
        root: {
          fontSize: "0.9375rem",
          lineHeight: 1.5,
          paddingTop: 18,
          paddingBottom: 18,
          borderColor: "divider",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, border: 1, borderColor: "divider" },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.25rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.35,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          overflow: "visible",
          paddingTop: 28,
          paddingBottom: 8,
          paddingLeft: 28,
          paddingRight: 28,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "20px 28px 28px",
          gap: 12,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 52,
          fontSize: "0.9375rem",
          transition: "box-shadow 0.15s ease",
          "&.Mui-focused": {
            boxShadow:
              mode === "light"
                ? "0 0 0 3px rgba(79, 70, 229, 0.15)"
                : "0 0 0 3px rgba(129, 140, 248, 0.2)",
          },
          "& .MuiOutlinedInput-input": {
            padding: "14px 16px",
            lineHeight: 1.5,
          },
          "& .MuiSelect-select": {
            minHeight: 22,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.9375rem",
          fontWeight: 500,
          letterSpacing: "-0.01em",
        },
        outlined: {
          "&.MuiInputLabel-shrink": {
            transform: "translate(16px, -9px) scale(0.78)",
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginTop: 8,
          fontSize: "0.8125rem",
          lineHeight: 1.45,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "0.8125rem",
          borderRadius: 8,
          letterSpacing: "-0.005em",
        },
        outlined: { borderWidth: 1.5 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontSize: "0.9375rem",
          lineHeight: 1.55,
        },
        title: {
          fontWeight: 700,
          letterSpacing: "-0.01em",
        },
        standardSuccess: {
          bgcolor: mode === "light" ? "rgba(5, 150, 105, 0.08)" : "rgba(52, 211, 153, 0.12)",
        },
        standardError: {
          bgcolor: mode === "light" ? "rgba(220, 38, 38, 0.08)" : "rgba(248, 113, 113, 0.12)",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 8, height: 10 },
      },
    },
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      },
      styleOverrides: {
        root: {
          alignItems: "flex-end",
          justifyContent: "center",
          height: "auto",
          minHeight: 0,
        },
        anchorOriginBottomCenter: {
          left: "50%",
          right: "auto",
          transform: "translateX(-50%)",
          bottom: 24,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: "0.8125rem",
          fontWeight: 500,
          lineHeight: 1.45,
          padding: "8px 12px",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "0.9375rem",
          lineHeight: 1.45,
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },
  },
});

export const createAppTheme = (mode: PaletteMode) =>
  createTheme(getDesignTokens(mode) as ThemeOptions);

/** Re-export for components that need consistent section gaps in sx props. */
export const layoutRhythm = {
  pagePaddingY: PAGE_PADDING_Y,
  pagePaddingX: PAGE_PADDING_X,
  cardPadding: CARD_PADDING,
  sectionGap: SECTION_GAP,
  formStackSpacing: FORM_STACK_SPACING,
};
