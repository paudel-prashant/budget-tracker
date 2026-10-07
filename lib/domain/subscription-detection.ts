import { RecurrenceFrequency } from "@prisma/client";
import { normalizeTitleKey } from "@/lib/domain/category-suggestion-engine";
import { getNextOccurrence, startOfUtcDay } from "@/lib/domain/recurrence-dates";

export type DetectableFrequency = "WEEKLY" | "MONTHLY" | "YEARLY";

export type ExpenseCharge = {
  title: string;
  /** In the user's base currency. */
  amount: number;
  date: Date;
  category: string;
};

export type ExistingRecurring = {
  id: string;
  title: string;
  amount: number;
  frequency: RecurrenceFrequency;
};

export type PriceChange = {
  previousAmount: number;
  newAmount: number;
  changedOn: string;
};

/** A repeating charge with no matching recurring item — suggest tracking it. */
export type SubscriptionSuggestion = {
  kind: "subscription";
  /** Stable id for dismissing: "subscription:<merchant>". */
  key: string;
  merchant: string;
  title: string;
  category: string;
  frequency: DetectableFrequency;
  amount: number;
  chargeCount: number;
  lastChargeDate: string;
  /** Next expected charge — used as the recurring item's start so nothing is double-posted. */
  nextExpectedDate: string;
  priceChange: PriceChange | null;
};

/**
 * A charge already tracked as a recurring item that got more expensive (an untracked
 * subscription carries its price change on the SubscriptionSuggestion instead).
 */
export type PriceIncreaseSuggestion = {
  kind: "price_increase";
  /** "price:<merchant>:<new amount in cents>" — a later increase shows up again. */
  key: string;
  merchant: string;
  title: string;
  frequency: DetectableFrequency;
  priceChange: PriceChange;
  /** The recurring item to update to the new amount. */
  recurringId: string;
  recurringAmount: number;
};

export type DetectedSuggestion = SubscriptionSuggestion | PriceIncreaseSuggestion;

type FrequencyProfile = {
  frequency: DetectableFrequency;
  nominalDays: number;
  toleranceDays: number;
  minCharges: number;
};

const PROFILES: FrequencyProfile[] = [
  { frequency: "WEEKLY", nominalDays: 7, toleranceDays: 2, minCharges: 3 },
  { frequency: "MONTHLY", nominalDays: 30.4, toleranceDays: 5, minCharges: 3 },
  { frequency: "YEARLY", nominalDays: 365, toleranceDays: 15, minCharges: 2 },
];

/** Share of intervals that must fit the frequency for the pattern to count as regular. */
const MIN_REGULAR_SHARE = 0.75;
/** "About the same amount": within this fraction of the typical charge. */
const AMOUNT_TOLERANCE = 0.25;
/** Fixed-price charges vary by less than this (rounding, tax) between bills. */
const FIXED_PRICE_TOLERANCE = 0.01;
/** Only flag a price increase within this many billing periods of it happening. */
const PRICE_CHANGE_RECENT_PERIODS = 2;

const DAY_MS = 86_400_000;

/**
 * Groups charges from the same merchant despite reference numbers in the title
 * ("NETFLIX.COM 866-579-7172" and "Netflix.com 1234" → "netflix com").
 */
export function merchantKey(title: string): string {
  return normalizeTitleKey(title)
    .split(" ")
    .filter((token) => token.length > 1 && !/\d/.test(token))
    .join(" ");
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function dayKey(date: Date): string {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

function samePrice(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(0.01, FIXED_PRICE_TOLERANCE * Math.max(a, b));
}

function classify(intervals: number[], chargeCount: number): FrequencyProfile | null {
  if (intervals.length === 0) return null;
  const typical = median(intervals);

  for (const profile of PROFILES) {
    if (chargeCount < profile.minCharges) continue;
    if (Math.abs(typical - profile.nominalDays) > profile.toleranceDays) continue;

    const regular = intervals.filter(
      (days) => Math.abs(days - profile.nominalDays) <= profile.toleranceDays
    ).length;
    if (regular / intervals.length >= MIN_REGULAR_SHARE) return profile;
  }

  return null;
}

/**
 * The latest change from one stable price to a higher one, if any. Requires at least two
 * charges at the old price so normal bill-to-bill variation (utilities) isn't flagged.
 */
function findPriceIncrease(charges: ExpenseCharge[]): PriceChange | null {
  const last = charges[charges.length - 1];
  let i = charges.length - 1;
  while (i > 0 && samePrice(charges[i - 1].amount, last.amount)) i -= 1;
  if (i === 0) return null;

  const previous = charges[i - 1].amount;
  let oldPriceCount = 0;
  for (let j = i - 1; j >= 0 && samePrice(charges[j].amount, previous); j -= 1) oldPriceCount += 1;

  if (oldPriceCount < 2 || last.amount <= previous) return null;

  return { previousAmount: previous, newAmount: last.amount, changedOn: dayKey(charges[i].date) };
}

function toRecurrenceFrequency(frequency: DetectableFrequency): RecurrenceFrequency {
  return RecurrenceFrequency[frequency];
}

function findMatchingRecurring(
  key: string,
  recurring: ExistingRecurring[]
): ExistingRecurring | null {
  return (
    recurring.find((item) => {
      const itemKey = merchantKey(item.title);
      return itemKey !== "" && (itemKey.includes(key) || key.includes(itemKey));
    }) ?? null
  );
}

/**
 * Finds repeating expense charges (subscriptions, bills) in transaction history:
 * same merchant, regular weekly/monthly/yearly spacing, about the same amount, and still
 * active. Unknown ones become "track this" suggestions; recent price rises are flagged.
 *
 * `charges` should exclude transactions already generated by a recurring item.
 */
export function detectSubscriptions(
  charges: ExpenseCharge[],
  recurring: ExistingRecurring[],
  today: Date = new Date()
): DetectedSuggestion[] {
  const byMerchant = new Map<string, ExpenseCharge[]>();
  for (const charge of charges) {
    const key = merchantKey(charge.title);
    if (!key) continue;
    const group = byMerchant.get(key) ?? [];
    group.push(charge);
    byMerchant.set(key, group);
  }

  const todayStart = startOfUtcDay(today);
  const suggestions: DetectedSuggestion[] = [];

  for (const [key, group] of byMerchant) {
    // One charge per day: a refund-and-recharge on the same day shouldn't look weekly.
    const seenDays = new Set<string>();
    const sorted = [...group]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .filter((charge) => {
        const day = dayKey(charge.date);
        if (seenDays.has(day)) return false;
        seenDays.add(day);
        return true;
      });

    const intervals = sorted
      .slice(1)
      .map((charge, index) =>
        Math.round((startOfUtcDay(charge.date).getTime() - startOfUtcDay(sorted[index].date).getTime()) / DAY_MS)
      );

    const profile = classify(intervals, sorted.length);
    if (!profile) continue;

    const typicalAmount = median(sorted.map((charge) => charge.amount));
    const consistent = sorted.filter(
      (charge) => Math.abs(charge.amount - typicalAmount) <= AMOUNT_TOLERANCE * typicalAmount
    ).length;
    if (consistent / sorted.length < MIN_REGULAR_SHARE) continue;

    const last = sorted[sorted.length - 1];
    const daysSinceLast = (todayStart.getTime() - startOfUtcDay(last.date).getTime()) / DAY_MS;
    if (daysSinceLast > profile.nominalDays * 1.5 + profile.toleranceDays) continue; // cancelled

    const recurringFrequency = toRecurrenceFrequency(profile.frequency);
    const match = findMatchingRecurring(key, recurring);

    let priceChange = findPriceIncrease(sorted);
    if (priceChange) {
      const ageDays = (todayStart.getTime() - new Date(priceChange.changedOn).getTime()) / DAY_MS;
      if (ageDays > profile.nominalDays * PRICE_CHANGE_RECENT_PERIODS + profile.toleranceDays) {
        priceChange = null;
      }
    }

    // A tracked recurring item still at the old price is also worth flagging.
    if (!priceChange && match && last.amount > match.amount && !samePrice(last.amount, match.amount)) {
      priceChange = {
        previousAmount: match.amount,
        newAmount: last.amount,
        changedOn: dayKey(last.date),
      };
    }

    if (!match) {
      const lastDay = startOfUtcDay(last.date);
      suggestions.push({
        kind: "subscription",
        key: `subscription:${key}`,
        merchant: key,
        title: last.title,
        category: last.category,
        frequency: profile.frequency,
        amount: last.amount,
        chargeCount: sorted.length,
        lastChargeDate: dayKey(last.date),
        nextExpectedDate: dayKey(getNextOccurrence(lastDay, recurringFrequency, lastDay)),
        priceChange,
      });
    }

    // Only worth flagging while the recurring item is still below the new price.
    if (match && priceChange && match.amount < priceChange.newAmount && !samePrice(match.amount, priceChange.newAmount)) {
      suggestions.push({
        kind: "price_increase",
        key: `price:${key}:${Math.round(priceChange.newAmount * 100)}`,
        merchant: key,
        title: match.title,
        frequency: profile.frequency,
        priceChange,
        recurringId: match.id,
        recurringAmount: match.amount,
      });
    }
  }

  // Price increases first (actionable), then the largest subscriptions.
  return suggestions.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "price_increase" ? -1 : 1;
    const amountA = a.kind === "subscription" ? a.amount : a.priceChange.newAmount;
    const amountB = b.kind === "subscription" ? b.amount : b.priceChange.newAmount;
    return amountB - amountA;
  });
}
