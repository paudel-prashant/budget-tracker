import { describe, expect, it } from "vitest";
import {
  chooseForecastTimeframe,
  getMonthDayKeys,
  summarizeMonthForecast,
} from "@/lib/domain/bills-calendar";

describe("getMonthDayKeys", () => {
  it("lists every day, including leap days", () => {
    const keys = getMonthDayKeys(2, 2028);
    expect(keys).toHaveLength(29);
    expect(keys[0]).toBe("2028-02-01");
    expect(keys.at(-1)).toBe("2028-02-29");
  });
});

describe("chooseForecastTimeframe", () => {
  it("picks the shortest forecast that reaches the month end", () => {
    expect(chooseForecastTimeframe("2026-10-31", "2026-10-28")).toBe("7d");
    expect(chooseForecastTimeframe("2026-10-31", "2026-10-07")).toBe("30d");
    expect(chooseForecastTimeframe("2026-12-31", "2026-10-07")).toBe("90d");
    expect(chooseForecastTimeframe("2027-03-31", "2026-10-07")).toBe("180d");
  });

  it("returns null for past months and beyond the 180-day horizon", () => {
    expect(chooseForecastTimeframe("2026-09-30", "2026-10-07")).toBeNull();
    expect(chooseForecastTimeframe("2026-10-07", "2026-10-07")).toBeNull();
    expect(chooseForecastTimeframe("2027-06-30", "2026-10-07")).toBeNull();
  });
});

describe("summarizeMonthForecast", () => {
  const monthKeys = getMonthDayKeys(10, 2026);

  it("finds the first projected shortfall and the lowest balance within the month", () => {
    const summary = summarizeMonthForecast(
      [
        { date: "2026-10-07", balance: 500, isProjected: false },
        { date: "2026-10-27", balance: 120, isProjected: true },
        { date: "2026-10-28", balance: -40, isProjected: true },
        { date: "2026-10-29", balance: -90, isProjected: true },
        { date: "2026-11-01", balance: -500, isProjected: true },
      ],
      monthKeys
    );

    expect(summary.dailyBalances).toHaveLength(3);
    expect(summary.shortfall).toEqual({ date: "2026-10-28", balance: -40 });
    expect(summary.lowestBalance).toEqual({ date: "2026-10-29", balance: -90 });
  });

  it("reports no shortfall when the balance stays positive", () => {
    const summary = summarizeMonthForecast(
      [{ date: "2026-10-20", balance: 75, isProjected: true }],
      monthKeys
    );
    expect(summary.shortfall).toBeNull();
    expect(summary.lowestBalance).toEqual({ date: "2026-10-20", balance: 75 });
  });
});
