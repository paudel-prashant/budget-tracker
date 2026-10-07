import { z } from "zod";
import { FinanceAccountType } from "@prisma/client";
import { toValidationResult, type ValidationResult } from "@/lib/validation/zod-helpers";

export type AccountInput = {
  name: string;
  type: FinanceAccountType;
  openingBalance: number;
  /** Always null for non-credit accounts. */
  creditLimit: number | null;
};

const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name is required and must be a non-empty string")
    .max(60, "name must be 60 characters or fewer"),
  type: z.nativeEnum(FinanceAccountType, {
    message: "type must be CHECKING, SAVINGS, CASH, CREDIT, INVESTMENT, or OTHER",
  }),
  // Negative is allowed: a credit card or overdraft can start below zero.
  openingBalance: z.number().finite("openingBalance must be a number").optional().default(0),
  creditLimit: z
    .number()
    .finite()
    .positive("creditLimit must be a positive number")
    .nullish(),
});

export function validateAccountBody(body: unknown): ValidationResult<AccountInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const parsed = toValidationResult(accountSchema.safeParse(body));
  if (!parsed.success) return parsed;

  return {
    success: true,
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      openingBalance: parsed.data.openingBalance,
      creditLimit:
        parsed.data.type === FinanceAccountType.CREDIT ? (parsed.data.creditLimit ?? null) : null,
    },
  };
}

const balanceSchema = z.object({
  balance: z.number().finite("balance must be a number"),
});

/** "Set the current balance" — e.g. an investment account's market value. */
export function validateBalanceUpdateBody(body: unknown): ValidationResult<{ balance: number }> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const parsed = toValidationResult(balanceSchema.safeParse(body));
  if (!parsed.success) return parsed;
  return { success: true, data: { balance: Math.round(parsed.data.balance * 100) / 100 } };
}

export type TransferInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: Date;
  note: string | null;
};

const transferSchema = z.object({
  fromAccountId: z.string().min(1, "fromAccountId is required"),
  toAccountId: z.string().min(1, "toAccountId is required"),
  amount: z.number().finite().positive("amount is required and must be a positive number"),
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "date is required and must be a valid ISO date string",
  }),
  note: z.string().trim().max(200, "note must be 200 characters or fewer").optional(),
});

export function validateTransferBody(body: unknown): ValidationResult<TransferInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const parsed = toValidationResult(transferSchema.safeParse(body));
  if (!parsed.success) return parsed;

  if (parsed.data.fromAccountId === parsed.data.toAccountId) {
    return { success: false, error: "Choose two different accounts" };
  }

  return {
    success: true,
    data: {
      fromAccountId: parsed.data.fromAccountId,
      toAccountId: parsed.data.toAccountId,
      amount: Math.round(parsed.data.amount * 100) / 100,
      date: new Date(parsed.data.date),
      note: parsed.data.note || null,
    },
  };
}
