import { describe, expect, it } from "vitest";
import { buildNetWorthComposition } from "@/lib/domain/net-worth-composition";
import type { Asset, Liability, NetWorthAccountItem } from "@/lib/types";

const asset = (category: string, value: number) => ({ category, value }) as unknown as Asset;
const liability = (category: string, value: number) => ({ category, value }) as unknown as Liability;
const account = (type: NetWorthAccountItem["type"], asset: number, liability: number) =>
  ({ id: type, name: type, type, balance: asset - liability, asset, liability }) as NetWorthAccountItem;

describe("buildNetWorthComposition", () => {
  it("groups accounts and items into stable buckets with fixed colour slots", () => {
    const result = buildNetWorthComposition(
      [asset("Gold", 1800), asset("real estate", 400000), asset("Boat", 9000)],
      [liability("Mortgage", 300000)],
      [account("CHECKING", 2500, 0), account("INVESTMENT", 20000, 0), account("CREDIT", 0, 900)]
    );
    const slot = (label: string) => result.assets.find((g) => g.label === label)?.slot;
    expect(slot("Cash")).toBe(0);
    expect(slot("Investments")).toBe(1);
    expect(slot("Gold")).toBe(2);
    expect(slot("Real Estate")).toBe(3);
    expect(slot("Other")).toBe(5);
    expect(result.liabilities.find((g) => g.label === "Credit Card")?.value).toBe(900);
    expect(result.liabilities.find((g) => g.label === "Mortgage")?.slot).toBe(2);
  });

  it("omits empty groups", () => {
    const result = buildNetWorthComposition([], [], [account("SAVINGS", 100, 0)]);
    expect(result.assets.length).toBe(1);
    expect(result.liabilities.length).toBe(0);
  });
});
