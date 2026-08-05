import type { Goal as PrismaGoal } from "@prisma/client";
import type { Goal } from "@/lib/types";

export function serializeGoal(goal: PrismaGoal): Goal {
  return {
    id: goal.id,
    name: goal.name,
    category: goal.category,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    targetDate: goal.targetDate ? goal.targetDate.toISOString() : null,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}
