import { describe, expect, it } from "vitest";
import { buildCumulativeFlow, densifyDailyBalance } from "@/lib/domain/daily-series";

const points = [
  { date: "2026-11-10", balance: 400, income: 0, expenses: 100 },
  { date: "2026-11-14", balance: 2300, income: 2000, expenses: 100 },
];

describe("densifyDailyBalance", () => {
  it("fills missing days, carrying the balance with zero flow", () => {
    const dense = densifyDailyBalance(points);
    expect(dense.length).toBe(5);
    expect(dense[2].date).toBe("2026-11-12");
    expect(dense[2].balance).toBe(400);
    expect(dense[2].expenses).toBe(0);
    expect(dense[4].balance).toBe(2300);
  });
});

describe("buildCumulativeFlow", () => {
  it("accumulates income and expenses day by day", () => {
    const flow = buildCumulativeFlow(points);
    expect(flow[0].expenses).toBe(100);
    expect(flow[4].income).toBe(2000);
    expect(flow[4].expenses).toBe(200);
  });
});
