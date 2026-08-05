/**
 * Preset category lists for assets/liabilities, shared between the server-side
 * validator (lib/validation/net-worth-validation.ts) and client-side forms
 * (components/net-worth/asset-liability-dialog.tsx).
 *
 * Deliberately kept dependency-free (no Zod) — importing it from a "use client"
 * component must not pull the Zod runtime into the browser bundle.
 */
export const ASSET_CATEGORIES = [
  "Cash",
  "Investments",
  "Real Estate",
  "Retirement",
  "Other",
] as const;

export const LIABILITY_CATEGORIES = [
  "Credit Card",
  "Loan",
  "Mortgage",
  "Student Loan",
  "Other",
] as const;
