import { resolveTransactionBaseAmount } from "@/lib/currency/convert";
import { getUserPreferredCurrency } from "@/lib/data/user-settings-data";

export async function buildTransactionWriteData(
  userId: string,
  input: {
    title: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    category: string;
    date: Date;
  }
) {
  const preferredCurrency = await getUserPreferredCurrency(userId);
  const currency = preferredCurrency;
  const baseAmount = await resolveTransactionBaseAmount({
    amount: input.amount,
    currency,
    preferredCurrency,
    date: input.date,
  });

  return {
    title: input.title,
    amount: input.amount,
    currency,
    baseAmount,
    type: input.type,
    category: input.category,
    date: input.date,
  };
}
