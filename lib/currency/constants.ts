/** ISO 4217 codes supported for display and conversion (Frankfurter / ECB). */
export const SUPPORTED_CURRENCIES = [
  { code: "CAD", label: "Canadian dollar", locale: "en-CA" },
  { code: "USD", label: "US dollar", locale: "en-US" },
  { code: "EUR", label: "Euro", locale: "en-IE" },
  { code: "GBP", label: "British pound", locale: "en-GB" },
  { code: "AUD", label: "Australian dollar", locale: "en-AU" },
  { code: "NZD", label: "New Zealand dollar", locale: "en-NZ" },
  { code: "CHF", label: "Swiss franc", locale: "de-CH" },
  { code: "JPY", label: "Japanese yen", locale: "ja-JP" },
  { code: "CNY", label: "Chinese yuan", locale: "zh-CN" },
  { code: "INR", label: "Indian rupee", locale: "en-IN" },
  { code: "MXN", label: "Mexican peso", locale: "es-MX" },
  { code: "SGD", label: "Singapore dollar", locale: "en-SG" },
  { code: "HKD", label: "Hong Kong dollar", locale: "en-HK" },
  { code: "SEK", label: "Swedish krona", locale: "sv-SE" },
  { code: "NOK", label: "Norwegian krone", locale: "nb-NO" },
  { code: "DKK", label: "Danish krone", locale: "da-DK" },
  { code: "PLN", label: "Polish zloty", locale: "pl-PL" },
  { code: "TRY", label: "Turkish lira", locale: "tr-TR" },
  { code: "ZAR", label: "South African rand", locale: "en-ZA" },
  { code: "BRL", label: "Brazilian real", locale: "pt-BR" },
] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: SupportedCurrencyCode = "CAD";

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code);

export const FRANKFURTER_API_URL = "https://api.frankfurter.app";
export const FRANKFURTER_DOCS_URL = "https://www.frankfurter.app/docs";

const localeByCode = new Map(SUPPORTED_CURRENCIES.map((c) => [c.code, c.locale]));

export function isSupportedCurrency(code: string): code is SupportedCurrencyCode {
  return SUPPORTED_CURRENCY_CODES.includes(code as SupportedCurrencyCode);
}

export function normalizeCurrencyCode(code: string | null | undefined): SupportedCurrencyCode {
  if (code && isSupportedCurrency(code)) {
    return code;
  }
  return DEFAULT_CURRENCY;
}

export function getLocaleForCurrency(code: string): string {
  return localeByCode.get(code as SupportedCurrencyCode) ?? "en-CA";
}

export function getCurrencyLabel(code: string): string {
  const match = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  return match ? `${match.code} — ${match.label}` : code;
}
