import { describe, expect, it } from "vitest";
import { getCategoryAppearance } from "@/lib/domain/category-appearance";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/lib/domain/transaction-categories";
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from "@/lib/domain/net-worth-categories";

describe("getCategoryAppearance", () => {
  it("gives every preset category a specific icon (never the generic fallback)", () => {
    const presets = [
      ...DEFAULT_EXPENSE_CATEGORIES,
      ...DEFAULT_INCOME_CATEGORIES,
      ...ASSET_CATEGORIES,
      ...LIABILITY_CATEGORIES,
    ];
    for (const category of presets) {
      expect(getCategoryAppearance(category).icon === "tag" ? category : "ok").toBe("ok");
    }
  });

  it("matches custom categories by keyword", () => {
    expect(getCategoryAppearance("Lottery").icon).toBe("lottery");
    expect(getCategoryAppearance("Netflix").icon).toBe("subscriptions");
    expect(getCategoryAppearance("Gym membership").icon).toBe("fitness");
    expect(getCategoryAppearance("Student Loan").icon).toBe("education");
    expect(getCategoryAppearance("Car loan").icon).toBe("loan");
  });

  it("matches at word starts only", () => {
    expect(getCategoryAppearance("Barber").icon).toBe("beauty");
    expect(getCategoryAppearance("Bar tab").icon).toBe("bar");
  });

  it("gives unknown categories a stable fallback colour", () => {
    const first = getCategoryAppearance("Zorblax");
    expect(first.icon).toBe("tag");
    expect(getCategoryAppearance("zorblax ").color).toBe(first.color);
  });
});

describe("getCategoryAppearance — short keywords", () => {
  it("does not let 'car' swallow 'card'", () => {
    expect(getCategoryAppearance("Gift card").icon).toBe("gift");
    expect(getCategoryAppearance("Car wash").icon).toBe("car");
    expect(getCategoryAppearance("Pets").icon).toBe("pets");
  });
});
