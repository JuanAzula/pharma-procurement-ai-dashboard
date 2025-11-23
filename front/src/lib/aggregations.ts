import { parseISO } from "date-fns";
import type { ProcurementNotice } from "@/types/ted";

export interface MonthlyAggregate {
  month: string;
  label: string;
  totalValue: number;
  noticeCount: number;
}

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
});

export function buildMonthlyAggregates(
  notices: ProcurementNotice[]
): MonthlyAggregate[] {
  const buckets = new Map<string, MonthlyAggregate>();

  for (const notice of notices) {
    if (!notice.awardDate) continue;
    const parsed = parseISO(notice.awardDate);
    if (Number.isNaN(parsed.getTime())) continue;
    const monthKey = `${parsed.getUTCFullYear()}-${String(
      parsed.getUTCMonth() + 1
    ).padStart(2, "0")}`;
    const bucket =
      buckets.get(monthKey) ??
      {
        month: monthKey,
        label: monthFormatter.format(parsed),
        totalValue: 0,
        noticeCount: 0,
      };

    const contractValue =
      typeof notice.contractValue === "number" && notice.contractValue > 0
        ? notice.contractValue
        : 0;

    bucket.totalValue += contractValue;
    bucket.noticeCount += 1;
    buckets.set(monthKey, bucket);
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
}

