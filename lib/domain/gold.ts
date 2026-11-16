/**
 * Gold holding math. Dependency-free so client forms and the server share it.
 * Weights are stored in grams; prices are quoted per troy ounce.
 */

export const GOLD_CATEGORY = "Gold";

export const GRAMS_PER_TROY_OUNCE = 31.1034768;

export const GOLD_WEIGHT_UNITS = [
  { value: "g", label: "Grams", grams: 1 },
  { value: "ozt", label: "Troy ounces", grams: GRAMS_PER_TROY_OUNCE },
  { value: "kg", label: "Kilograms", grams: 1000 },
  { value: "tola", label: "Tola", grams: 11.6638038 },
] as const;

export type GoldWeightUnit = (typeof GOLD_WEIGHT_UNITS)[number]["value"];

export const GOLD_PURITIES = [
  { label: "24K (99.99%)", value: 0.9999 },
  { label: "24K (99.9%)", value: 0.999 },
  { label: "22K (91.67%)", value: 0.9167 },
  { label: "18K (75%)", value: 0.75 },
  { label: "14K (58.5%)", value: 0.585 },
  { label: "10K (41.7%)", value: 0.417 },
] as const;

export function isGoldCategory(category: string | null | undefined): boolean {
  return (category ?? "").trim().toLowerCase() === GOLD_CATEGORY.toLowerCase();
}

export function toGrams(weight: number, unit: GoldWeightUnit): number {
  const match = GOLD_WEIGHT_UNITS.find((u) => u.value === unit);
  return weight * (match?.grams ?? 1);
}

export function fromGrams(grams: number, unit: GoldWeightUnit): number {
  const match = GOLD_WEIGHT_UNITS.find((u) => u.value === unit);
  return grams / (match?.grams ?? 1);
}

export function pricePerGram(pricePerOunce: number): number {
  return pricePerOunce / GRAMS_PER_TROY_OUNCE;
}

/** Market value of a holding, rounded to cents. */
export function goldHoldingValue(grams: number, purity: number, pricePerOunce: number): number {
  const pureGrams = grams * purity;
  return Math.round(pureGrams * pricePerGram(pricePerOunce) * 100) / 100;
}

export function purityLabel(purity: number): string {
  const match = GOLD_PURITIES.find((p) => Math.abs(p.value - purity) < 0.00005);
  return match ? match.label.split(" ")[0] : `${(purity * 100).toFixed(2)}%`;
}
