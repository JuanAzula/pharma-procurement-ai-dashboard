const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
});

export type MetricMode = "value" | "count";

export interface ProcurementNoticeInput {
  awardDate: string;
  contractValue?: number | null;
  country?: string | null;
}

export interface MonthlyAggregateInput {
  month: string;
  label?: string;
  totalValue?: number | null;
  noticeCount?: number | null;
}

export interface MonthlyPoint {
  key: string;
  label: string;
  date: Date;
  totalValue: number;
  noticeCount: number;
}

export function buildMonthlyHistory(
  aggregates?: MonthlyAggregateInput[],
  notices?: ProcurementNoticeInput[]
): MonthlyPoint[] {
  const buckets = new Map<string, MonthlyPoint>();

  if (aggregates) {
    for (const aggregate of aggregates) {
      const date = parseMonthInput(aggregate.month);
      if (!date) continue;
      const key = formatMonthKey(date);
      const bucket = buckets.get(key) ?? createBucket(date);
      bucket.totalValue += Math.max(0, aggregate.totalValue ?? 0);
      bucket.noticeCount += Math.max(0, aggregate.noticeCount ?? 0);
      buckets.set(key, bucket);
    }
  }

  if (notices) {
    for (const notice of notices) {
      const date = parseDateInput(notice.awardDate);
      if (!date) continue;
      const key = formatMonthKey(date);
      const bucket = buckets.get(key) ?? createBucket(date);
      const value =
        typeof notice.contractValue === "number" && notice.contractValue > 0
          ? notice.contractValue
          : 0;
      bucket.totalValue += value;
      bucket.noticeCount += 1;
      buckets.set(key, bucket);
    }
  }

  return Array.from(buckets.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

export function createBucket(date: Date): MonthlyPoint {
  return {
    key: formatMonthKey(date),
    label: formatLabel(date),
    date,
    totalValue: 0,
    noticeCount: 0,
  };
}

export function parseMonthInput(value: string | undefined): Date | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}$/.test(value)) {
    return startOfMonthUTC(new Date(`${value}-01T00:00:00.000Z`));
  }
  const parsed = parseDateInput(value);
  return parsed ? startOfMonthUTC(parsed) : null;
}

export function parseDateInput(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function addMonths(date: Date, months: number): Date {
  const result = startOfMonthUTC(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export function formatMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

export function formatLabel(date: Date): string {
  return monthFormatter.format(date);
}


