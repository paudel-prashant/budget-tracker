"use client";

import { createTheme, type PaletteMode } from "@mui/material/styles";

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          primary: { main: "#1a73e8" },
          secondary: { main: "#5f6368" },
          background: { default: "#f4f6f8", paper: "#ffffff" },
          divider: "rgba(0, 0, 0, 0.08)",
          text: {
            primary: "#1f2933",
            secondary: "#5f6b7a",
          },
        }
      : {
          primary: { main: "#8ab4f8" },
          secondary: { main: "#9aa0a6" },
          background: { default: "#0f1114", paper: "#1a1d21" },
          divider: "rgba(255, 255, 255, 0.1)",
          text: {
            primary: "#e8eaed",
            secondary: "#9aa0a6",
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: "1.75rem",
      lineHeight: 1.3,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.35,
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.05rem",
      lineHeight: 1.4,
    },
    subtitle1: {
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: "0.8125rem",
      letterSpacing: "0.02em",
      textTransform: "uppercase" as const,
    },
    body1: {
      fontSize: "0.9375rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.55,
    },
    button: {
      textTransform: "none" as const,
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 10,
  },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: "smooth",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderBottom: 1,
          borderColor: "divider",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 1,
          borderColor: "divider",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: "3px 10px",
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 18,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: mode === "light" ? "#5f6b7a" : "#9aa0a6",
          fontSize: "0.8125rem",
        },
        root: {
          paddingTop: 14,
          paddingBottom: 14,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          overflow: "visible",
          paddingTop: 20,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          paddingBottom: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined" as const,
        size: "medium" as const,
      },
      styleOverrides: {
        root: {
          margin: 0,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 56,
          boxSizing: "border-box",
        },
        input: {
          padding: "16.5px 14px",
          boxSizing: "border-box",
        },
        inputSizeMedium: {
          padding: "16.5px 14px",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          minHeight: 23,
          padding: "16.5px 14px",
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box",
        },
        outlined: {
          paddingRight: "32px !important",
        },
      },
    },
    MuiPickersOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 56,
          borderRadius: 10,
        },
        sectionsContainer: {
          padding: "16.5px 0",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.9375rem",
        },
        outlined: {
          "&.MuiInputLabel-shrink": {
            transform: "translate(14px, -9px) scale(0.75)",
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          margin: 0,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 20,
          paddingRight: 20,
          "@media (min-width:600px)": {
            paddingLeft: 24,
            paddingRight: 24,
          },
        },
      },
    },
  },
});

export const createAppTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));
