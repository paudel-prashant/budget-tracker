import { RecurrenceFrequency } from "@prisma/client";

const MAX_OCCURRENCES = 3660;

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function clampDayToMonth(year: number, month: number, anchorDay: number): number {
  return Math.min(anchorDay, daysInUtcMonth(year, month));
}

export function getNextOccurrence(
  current: Date,
  frequency: RecurrenceFrequency,
  startDate: Date
): Date {
  const anchorDay = startDate.getUTCDate();
  const anchorMonth = startDate.getUTCMonth();
  const base = startOfUtcDay(current);

  switch (frequency) {
    case RecurrenceFrequency.DAILY: {
      const next = new Date(base);
      next.setUTCDate(next.getUTCDate() + 1);
      return next;
    }
    case RecurrenceFrequency.WEEKLY: {
      const next = new Date(base);
      next.setUTCDate(next.getUTCDate() + 7);
      return next;
    }
    case RecurrenceFrequency.MONTHLY: {
      let year = base.getUTCFullYear();
      let month = base.getUTCMonth() + 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      const day = clampDayToMonth(year, month, anchorDay);
      return new Date(Date.UTC(year, month, day));
    }
    case RecurrenceFrequency.YEARLY: {
      const year = base.getUTCFullYear() + 1;
      const day = clampDayToMonth(year, anchorMonth, anchorDay);
      return new Date(Date.UTC(year, anchorMonth, day));
    }
    default:
      return base;
  }
}

export function getDueOccurrences(
  startDate: Date,
  frequency: RecurrenceFrequency,
  lastProcessedAt: Date | null,
  endDate: Date | null,
  asOf: Date = new Date()
): Date[] {
  const today = startOfUtcDay(asOf);
  const start = startOfUtcDay(startDate);
  const end = endDate ? startOfUtcDay(endDate) : today;
  const upperBound = end < today ? end : today;

  if (start > upperBound) {
    return [];
  }

  let cursor = lastProcessedAt
    ? getNextOccurrence(startOfUtcDay(lastProcessedAt), frequency, start)
    : start;

  const occurrences: Date[] = [];
  let iterations = 0;

  while (cursor <= upperBound && iterations < MAX_OCCURRENCES) {
    if (cursor >= start) {
      occurrences.push(cursor);
    }
    cursor = getNextOccurrence(cursor, frequency, start);
    iterations += 1;
  }

  return occurrences;
}
