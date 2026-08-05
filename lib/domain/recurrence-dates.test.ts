import { describe, expect, it } from "vitest";
import { RecurrenceFrequency } from "@prisma/client";
import {
  getDueOccurrences,
  getFutureOccurrences,
  getNextOccurrence,
  startOfUtcDay,
} from "@/lib/domain/recurrence-dates";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const iso = (d: Date) => d.toISOString().slice(0, 10);

describe("startOfUtcDay", () => {
  it("truncates time-of-day components in UTC", () => {
    const withTime = new Date(Date.UTC(2026, 5, 15, 13, 45, 30));
    expect(startOfUtcDay(withTime).toISOString()).toBe("2026-06-15T00:00:00.000Z");
  });
});

describe("getNextOccurrence", () => {
  it("advances daily by one day", () => {
    const next = getNextOccurrence(utc(2026, 0, 31), RecurrenceFrequency.DAILY, utc(2026, 0, 1));
    expect(iso(next)).toBe("2026-02-01");
  });

  it("advances weekly by seven days", () => {
    const next = getNextOccurrence(utc(2026, 0, 1), RecurrenceFrequency.WEEKLY, utc(2026, 0, 1));
    expect(iso(next)).toBe("2026-01-08");
  });

  it("advances monthly, keeping the anchor day", () => {
    const next = getNextOccurrence(utc(2026, 0, 15), RecurrenceFrequency.MONTHLY, utc(2026, 0, 15));
    expect(iso(next)).toBe("2026-02-15");
  });

  it("rolls monthly December into January of the next year", () => {
    const next = getNextOccurrence(utc(2026, 11, 15), RecurrenceFrequency.MONTHLY, utc(2026, 0, 15));
    expect(iso(next)).toBe("2027-01-15");
  });

  it("clamps monthly anchor day 31 into shorter months (e.g. April)", () => {
    // Anchor is Jan 31; current occurrence is March 31 -> next should clamp to April 30.
    const next = getNextOccurrence(utc(2026, 2, 31), RecurrenceFrequency.MONTHLY, utc(2026, 0, 31));
    expect(iso(next)).toBe("2026-04-30");
  });

  it("clamps monthly anchor day 29/30/31 into February", () => {
    const next = getNextOccurrence(utc(2026, 0, 31), RecurrenceFrequency.MONTHLY, utc(2026, 0, 31));
    // 2026 is not a leap year -> Feb has 28 days.
    expect(iso(next)).toBe("2026-02-28");
  });

  it("advances yearly, keeping anchor month/day", () => {
    const next = getNextOccurrence(utc(2026, 5, 10), RecurrenceFrequency.YEARLY, utc(2020, 5, 10));
    expect(iso(next)).toBe("2027-06-10");
  });

  it("clamps yearly Feb 29 anchor into non-leap years", () => {
    const next = getNextOccurrence(utc(2024, 1, 29), RecurrenceFrequency.YEARLY, utc(2020, 1, 29));
    expect(iso(next)).toBe("2025-02-28");
  });
});

describe("getDueOccurrences", () => {
  it("returns no occurrences when the start date is in the future", () => {
    const asOf = utc(2026, 0, 1);
    const start = utc(2026, 5, 1);
    const result = getDueOccurrences(start, RecurrenceFrequency.MONTHLY, null, null, asOf);
    expect(result).toEqual([]);
  });

  it("includes the start date itself as the first due occurrence", () => {
    const asOf = utc(2026, 0, 1);
    const start = utc(2026, 0, 1);
    const result = getDueOccurrences(start, RecurrenceFrequency.MONTHLY, null, null, asOf);
    expect(result.map(iso)).toEqual(["2026-01-01"]);
  });

  it("generates all monthly occurrences up to today when never processed", () => {
    const asOf = utc(2026, 3, 1); // April 1
    const start = utc(2026, 0, 1); // Jan 1
    const result = getDueOccurrences(start, RecurrenceFrequency.MONTHLY, null, null, asOf);
    expect(result.map(iso)).toEqual(["2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01"]);
  });

  it("only generates occurrences after lastProcessedAt (no duplicates)", () => {
    const asOf = utc(2026, 3, 1);
    const start = utc(2026, 0, 1);
    const lastProcessedAt = utc(2026, 1, 1); // already processed through Feb 1
    const result = getDueOccurrences(start, RecurrenceFrequency.MONTHLY, lastProcessedAt, null, asOf);
    expect(result.map(iso)).toEqual(["2026-03-01", "2026-04-01"]);
  });

  it("stops at an endDate even if that is before today", () => {
    const asOf = utc(2026, 5, 1);
    const start = utc(2026, 0, 1);
    const endDate = utc(2026, 1, 1); // Feb 1
    const result = getDueOccurrences(start, RecurrenceFrequency.MONTHLY, null, endDate, asOf);
    expect(result.map(iso)).toEqual(["2026-01-01", "2026-02-01"]);
  });

  it("returns nothing once fully processed and no new occurrence is due", () => {
    const asOf = utc(2026, 0, 15);
    const start = utc(2026, 0, 1);
    const lastProcessedAt = utc(2026, 0, 1);
    const result = getDueOccurrences(start, RecurrenceFrequency.MONTHLY, lastProcessedAt, null, asOf);
    expect(result).toEqual([]);
  });
});

describe("getFutureOccurrences", () => {
  it("returns occurrences strictly after `from` through `through`", () => {
    const start = utc(2026, 0, 1);
    const from = utc(2026, 0, 1);
    const through = utc(2026, 3, 1);
    const result = getFutureOccurrences(start, RecurrenceFrequency.MONTHLY, from, through, null);
    expect(result.map(iso)).toEqual(["2026-02-01", "2026-03-01", "2026-04-01"]);
  });

  it("excludes occurrences beyond a recurring endDate", () => {
    const start = utc(2026, 0, 1);
    const from = utc(2026, 0, 1);
    const through = utc(2026, 5, 1);
    const endDate = utc(2026, 2, 1); // March 1
    const result = getFutureOccurrences(start, RecurrenceFrequency.MONTHLY, from, through, endDate);
    expect(result.map(iso)).toEqual(["2026-02-01", "2026-03-01"]);
  });

  it("returns an empty array when the start date is after the window", () => {
    const start = utc(2026, 5, 1);
    const from = utc(2026, 0, 1);
    const through = utc(2026, 1, 1);
    const result = getFutureOccurrences(start, RecurrenceFrequency.MONTHLY, from, through, null);
    expect(result).toEqual([]);
  });

  it("handles weekly frequency across the window", () => {
    const start = utc(2026, 0, 1); // Thursday
    const from = utc(2026, 0, 1);
    const through = utc(2026, 0, 22);
    const result = getFutureOccurrences(start, RecurrenceFrequency.WEEKLY, from, through, null);
    expect(result.map(iso)).toEqual(["2026-01-08", "2026-01-15", "2026-01-22"]);
  });
});
