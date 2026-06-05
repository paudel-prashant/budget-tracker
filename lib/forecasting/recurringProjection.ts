import type { RecurrenceFrequency, TransactionType } from "@prisma/client";
import { getFutureOccurrences, startOfUtcDay } from "@/lib/domain/recurrence-dates";
import type { RecurringForecastEvent } from "@/lib/forecasting/types";
import { toDateKey } from "@/lib/forecasting/types";

export type RecurringSource = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate: Date | null;
};

export function projectRecurringEvents(
  recurring: RecurringSource[],
  from: Date,
  through: Date
): RecurringForecastEvent[] {
  const fromDay = startOfUtcDay(from);
  const throughDay = startOfUtcDay(through);
  const events: RecurringForecastEvent[] = [];

  for (const item of recurring) {
    const dates = getFutureOccurrences(
      item.startDate,
      item.frequency,
      fromDay,
      throughDay,
      item.endDate
    );

    for (const date of dates) {
      events.push({
        recurringId: item.id,
        title: item.title,
        amount: item.amount,
        type: item.type,
        category: item.category,
        frequency: item.frequency,
        date: toDateKey(date),
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}
