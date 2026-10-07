import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FinanceAccountType } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { syncAllFinanceAccountBalances } from "@/lib/data/finance-account-data";
import { getUserPreferredCurrency } from "@/lib/data/user-settings-data";
import { revalidateFinancePages } from "@/lib/utils/revalidate-pages";
import { toValidationResult } from "@/lib/validation/zod-helpers";

export const runtime = "nodejs";

const convertSchema = z.object({
  kind: z.enum(["asset", "liability"], { message: "kind must be asset or liability" }),
  id: z.string().min(1, "id is required"),
  type: z.nativeEnum(FinanceAccountType, { message: "type must be a valid account type" }),
  creditLimit: z.number().finite().positive("creditLimit must be a positive number").nullish(),
});

/**
 * Moves a manually-entered net-worth item (e.g. a "TFSA" asset or "Visa" liability) onto
 * the Accounts page, where its balance follows transactions and transfers. The item is
 * replaced — not copied — so it's never counted twice in net worth.
 */
export async function POST(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const parsed = toValidationResult(convertSchema.safeParse(body ?? {}));
    if (!parsed.success) return jsonError(parsed.error, 400);
    const { kind, id, type, creditLimit } = parsed.data;

    const item =
      kind === "asset"
        ? await prisma.asset.findFirst({ where: { id, userId: auth.userId } })
        : await prisma.liability.findFirst({ where: { id, userId: auth.userId } });
    if (!item) return jsonError(`${kind === "asset" ? "Asset" : "Liability"} not found`, 404);

    // A liability is money owed, so it becomes a negative balance.
    const openingBalance = kind === "asset" ? item.value : -item.value;
    const currency = await getUserPreferredCurrency(auth.userId);

    const [account] = await prisma.$transaction([
      prisma.financeAccount.create({
        data: {
          userId: auth.userId,
          name: item.name,
          type,
          openingBalance,
          currentBalance: openingBalance,
          creditLimit: type === FinanceAccountType.CREDIT ? (creditLimit ?? null) : null,
          currency,
        },
      }),
      kind === "asset"
        ? prisma.asset.delete({ where: { id } })
        : prisma.liability.delete({ where: { id } }),
    ]);

    await syncAllFinanceAccountBalances(auth.userId);
    revalidateFinancePages();

    return NextResponse.json({ accountId: account.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
