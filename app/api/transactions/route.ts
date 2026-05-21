import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { validateCreateTransactionBody } from "@/lib/transaction-validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    assertDatabaseUrl();
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertDatabaseUrl();
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const validation = validateCreateTransactionBody(body);

    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const transaction = await prisma.transaction.create({
      data: validation.data,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
