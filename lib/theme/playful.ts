import { alpha } from "@mui/material/styles";

/**
 * Shared "a little playful" card treatment: a soft tinted wash in the top-right corner,
 * a gentle lift on hover, and a tilted icon tile that straightens up when hovered.
 * Motion is skipped for users who prefer reduced motion.
 */
export function playfulCardSx(color: string, isDark: boolean) {
  return {
    backgroundImage: `radial-gradient(120% 90% at 100% 0%, ${alpha(color, isDark ? 0.16 : 0.09)} 0%, transparent 55%)`,
    transition: "transform 180ms ease, box-shadow 180ms ease",
    "&:hover": { transform: "translateY(-2px)" },
    "&:hover .playful-icon": { transform: "rotate(0deg) scale(1.06)" },
    "&:hover .playful-icon svg": { transform: "rotate(0deg)" },
    "@media (prefers-reduced-motion: reduce)": {
      transition: "none",
      "&:hover": { transform: "none" },
      "&:hover .playful-icon": { transform: "rotate(-8deg)" },
    },
  } as const;
}

export function playfulIconSx(color: string, isDark: boolean) {
  return {
    width: 48,
    height: 48,
    borderRadius: 2.5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color,
    background: `linear-gradient(135deg, ${alpha(color, isDark ? 0.32 : 0.22)} 0%, ${alpha(color, 0.06)} 100%)`,
    boxShadow: `0 6px 16px -8px ${alpha(color, 0.6)}`,
    transform: "rotate(-8deg)",
    transition: "transform 220ms cubic-bezier(.3,1.6,.5,1)",
    "& svg": { transform: "rotate(8deg)", transition: "transform 220ms ease" },
  } as const;
}
