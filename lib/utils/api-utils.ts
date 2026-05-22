import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return jsonError("Record not found", 404);
    }
    if (error.code === "P2002") {
      const target = error.meta?.target;

      if (Array.isArray(target) && target.includes("importHash")) {
        return jsonError(
          "Another transaction with the same details already exists",
          409
        );
      }

      return jsonError("A budget already exists for this category and month", 409);
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("[API Error] Database connection failed:", error.message);
    return jsonError(
      "Database is unavailable. Check DATABASE_URL and Postgres configuration.",
      503
    );
  }

  if (error instanceof Error && error.message.includes("DATABASE_URL")) {
    return jsonError(error.message, 503);
  }

  console.error("[API Error]", error);
  return jsonError("Internal server error", 500);
}
