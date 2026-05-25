import { Plus_Jakarta_Sans } from "next/font/google";

/**
 * Primary UI typeface — readable for dashboards, numbers, and dense forms.
 * Loaded via next/font (self-hosted, no render-blocking Google CSS request).
 */
export const appFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

export const fontFamilyStack = "var(--font-sans), system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
