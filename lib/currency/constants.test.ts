import { describe, expect, it } from "vitest";
import {
  DEFAULT_CURRENCY,
  getCurrencyLabel,
  getLocaleForCurrency,
  isSupportedCurrency,
  normalizeCurrencyCode,
} from "@/lib/currency/constants";

describe("isSupportedCurrency", () => {
  it("accepts known ISO codes", () => {
    expect(isSupportedCurrency("USD")).toBe(true);
    expect(isSupportedCurrency("CAD")).toBe(true);
  });

  it("rejects unknown codes and wrong casing", () => {
    expect(isSupportedCurrency("XYZ")).toBe(false);
    expect(isSupportedCurrency("usd")).toBe(false);
  });
});

describe("normalizeCurrencyCode", () => {
  it("passes through a supported code", () => {
    expect(normalizeCurrencyCode("USD")).toBe("USD");
  });

  it("falls back to the default currency for null/undefined/unsupported input", () => {
    expect(normalizeCurrencyCode(null)).toBe(DEFAULT_CURRENCY);
    expect(normalizeCurrencyCode(undefined)).toBe(DEFAULT_CURRENCY);
    expect(normalizeCurrencyCode("XYZ")).toBe(DEFAULT_CURRENCY);
  });
});

describe("getLocaleForCurrency", () => {
  it("returns the mapped locale for a known code", () => {
    expect(getLocaleForCurrency("JPY")).toBe("ja-JP");
  });

  it("falls back to en-CA for an unknown code", () => {
    expect(getLocaleForCurrency("XYZ")).toBe("en-CA");
  });
});

describe("getCurrencyLabel", () => {
  it("returns a formatted code + label for a known currency", () => {
    expect(getCurrencyLabel("USD")).toBe("USD — US dollar");
  });

  it("returns the raw code for an unknown currency", () => {
    expect(getCurrencyLabel("XYZ")).toBe("XYZ");
  });
});
