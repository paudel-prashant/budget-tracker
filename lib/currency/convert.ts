import { getExchangeRate } from "@/lib/currency/exchange-rates";
import { roundMoney } from "@/lib/forecasting/types";

export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
  date: Date = new Date()
): Promise<number> {
  if (from === to) {
    return roundMoney(amount);
  }

  const rate = await getExchangeRate(from, to, date);
  return roundMoney(amount * rate);
}

export async function resolveTransactionBaseAmount(input: {
  amount: number;
  currency: string;
  preferredCurrency: string;
  date: Date;
}): Promise<number> {
  return convertCurrency(input.amount, input.currency, input.preferredCurrency, input.date);
}
