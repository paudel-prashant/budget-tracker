import { describe, expect, it } from "vitest";
import { validateGoalBody } from "@/lib/validation/goal-validation";

const validGoal = {
  name: "Emergency fund",
  category: "Savings",
  targetAmount: 5000,
  currentAmount: 1200,
  targetDate: "2027-01-01",
};

describe("validateGoalBody", () => {
  it("accepts a fully specified goal", () => {
    const result = validateGoalBody(validGoal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Emergency fund");
      expect(result.data.category).toBe("Savings");
      expect(result.data.targetAmount).toBe(5000);
      expect(result.data.currentAmount).toBe(1200);
      expect(result.data.targetDate).toBeInstanceOf(Date);
    }
  });

  it("rejects a non-object body", () => {
    expect(validateGoalBody(null).success).toBe(false);
  });

  it("rejects an empty or missing name", () => {
    expect(validateGoalBody({ ...validGoal, name: "" }).success).toBe(false);
    expect(validateGoalBody({ ...validGoal, name: "   " }).success).toBe(false);
  });

  it("rejects a name over 120 characters", () => {
    expect(validateGoalBody({ ...validGoal, name: "a".repeat(121) }).success).toBe(false);
  });

  it("rejects a non-positive targetAmount", () => {
    expect(validateGoalBody({ ...validGoal, targetAmount: 0 }).success).toBe(false);
    expect(validateGoalBody({ ...validGoal, targetAmount: -100 }).success).toBe(false);
  });

  it("rejects a negative currentAmount", () => {
    expect(validateGoalBody({ ...validGoal, currentAmount: -1 }).success).toBe(false);
  });

  it("allows a zero currentAmount", () => {
    expect(validateGoalBody({ ...validGoal, currentAmount: 0 }).success).toBe(true);
  });

  it("defaults currentAmount to 0 when omitted", () => {
    const rest: Record<string, unknown> = { ...validGoal };
    delete rest.currentAmount;
    const result = validateGoalBody(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentAmount).toBe(0);
    }
  });

  it("defaults category to null when omitted", () => {
    const rest: Record<string, unknown> = { ...validGoal };
    delete rest.category;
    const result = validateGoalBody(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBeNull();
    }
  });

  it("defaults targetDate to null when omitted", () => {
    const rest: Record<string, unknown> = { ...validGoal };
    delete rest.targetDate;
    const result = validateGoalBody(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetDate).toBeNull();
    }
  });

  it("accepts an explicit null targetDate", () => {
    const result = validateGoalBody({ ...validGoal, targetDate: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetDate).toBeNull();
    }
  });

  it("rejects an unparsable targetDate", () => {
    expect(validateGoalBody({ ...validGoal, targetDate: "whenever" }).success).toBe(false);
  });

  it("rejects a category over 60 characters", () => {
    expect(validateGoalBody({ ...validGoal, category: "a".repeat(61) }).success).toBe(false);
  });
});
