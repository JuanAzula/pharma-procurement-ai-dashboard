import {
  MetricMode,
  MonthlyAggregateInput,
  MonthlyPoint,
  ProcurementNoticeInput,
  buildMonthlyHistory,
  formatLabel,
  startOfMonthUTC,
} from "./aggregations";
import {
  fetchPharmaProcurementMacro,
  ProcurementMacroEntry,
} from "./procurementMacroService";
import { translateText, batchTranslate } from "./translationService";

interface InsightHighlight {
  title: string;
  detail: string;
  sentiment: "positive" | "negative" | "neutral";
}

interface InsightCard {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "warning";
}

interface InsightMeta {
  metricMode: MetricMode;
  lastObservedMonth: string;
  lastObservedLabel: string;
  stalenessMonths: number;
  timeframeMonths: number;
  totalNotices: number;
}

export interface InsightResponse {
  status: "ready" | "no-data";
  summary: string;
  highlights: InsightHighlight[];
  cards: InsightCard[];
  meta: InsightMeta;
}

export interface InsightRequestPayload {
  aggregates?: MonthlyAggregateInput[];
  notices?: ProcurementNoticeInput[];
  metric?: MetricMode;
  targetLanguage?: string;
}

export async function generateInsights(
  payload: InsightRequestPayload
): Promise<InsightResponse> {
  const monthlyHistory = buildMonthlyHistory(
    payload.aggregates,
    payload.notices
  );

  if (monthlyHistory.length === 0) {
    return {
      status: "no-data",
      summary: "No awarded notices available for insights.",
      highlights: [],
      cards: [],
      meta: {
        metricMode: payload.metric ?? "count",
        lastObservedMonth: "",
        lastObservedLabel: "",
        stalenessMonths: 0,
        timeframeMonths: 0,
        totalNotices: 0,
      },
    };
  }

  const metricMode = determineMetric(monthlyHistory, payload.metric);
  const lastMonth = monthlyHistory[monthlyHistory.length - 1];
  const stalenessMonths = monthsBetween(
    startOfMonthUTC(new Date()),
    lastMonth.date
  );

  const timelineStats = buildTimelineStats(monthlyHistory, metricMode);
  const countryStats = buildCountryStats(payload.notices ?? []);
  const macroBudgets = await fetchPharmaProcurementMacro({
    year: new Date().getUTCFullYear() - 1,
  });
  const macroSignals = buildMacroAlignment(countryStats, macroBudgets);

  const summaryParts = [
    timelineStats.spike
      ? `Peak detected in ${
          timelineStats.spike.label
        } (${timelineStats.spike.delta.toFixed(1)}% above typical month).`
      : "No significant monthly spikes detected.",
    countryStats.topCountry
      ? `${countryStats.topCountry.country} leads with ${formatMetricValue(
          countryStats.topCountry.value,
          metricMode
        )} (${countryStats.topCountry.share.toFixed(1)}% of total).`
      : "Country distribution is evenly spread.",
    macroSignals.length
      ? `${macroSignals[0].country} has utilised ${(
          macroSignals[0].coverage * 100
        ).toFixed(1)}% of its 2025 budget assumption.`
      : "No external budget signals matched the current dataset.",
  ];

  const highlights: InsightHighlight[] = [];
  if (timelineStats.spike) {
    highlights.push({
      title: "Monthly spike",
      detail: `Strong jump in ${
        timelineStats.spike.label
      } (${timelineStats.spike.delta.toFixed(1)}% above baseline).`,
      sentiment: "positive",
    });
  }
  if (timelineStats.contraction) {
    highlights.push({
      title: "Momentum loss",
      detail: `${timelineStats.contraction.delta.toFixed(
        1
      )}% drop comparing last quarter vs previous quarter.`,
      sentiment: "negative",
    });
  }
  if (countryStats.mostSurprising) {
    highlights.push({
      title: "Surprising country",
      detail: `${
        countryStats.mostSurprising.country
      } contributed ${countryStats.mostSurprising.share.toFixed(
        1
      )}% despite typically smaller allocation.`,
      sentiment: "neutral",
    });
  }

  const cards: InsightCard[] = [
    {
      label: "Last award month",
      value: lastMonth.label,
      helper: stalenessMonths
        ? `${stalenessMonths} month gap`
        : "Fresh dataset",
      tone: stalenessMonths >= 6 ? "warning" : "default",
    },
    {
      label: "Top country",
      value: countryStats.topCountry
        ? `${countryStats.topCountry.country}`
        : "N/A",
      helper: countryStats.topCountry
        ? `${formatMetricValue(
            countryStats.topCountry.value,
            metricMode
          )} · ${countryStats.topCountry.share.toFixed(1)}% share`
        : undefined,
    },
    {
      label: "Largest spike",
      value: timelineStats.spike ? timelineStats.spike.label : "No spike",
      helper: timelineStats.spike
        ? `+${timelineStats.spike.delta.toFixed(1)}% vs median`
        : undefined,
    },
    {
      label: "External signal",
      value: macroSignals.length
        ? `${macroSignals[0].country} budget`
        : "No match",
      helper: macroSignals.length
        ? `${(macroSignals[0].coverage * 100).toFixed(1)}% utilised of €${(
            macroSignals[0].allocation / 1_000_000
          ).toFixed(0)}M plan`
        : undefined,
    },
  ];

  // Translate card labels and helper text if targetLanguage is provided
  let translatedCards = cards;
  if (payload.targetLanguage && payload.targetLanguage !== "en") {
    const cardLabels = cards.map((c) => c.label);
    const cardHelpers = cards.map((c) => c.helper || "");

    const [translatedLabels, translatedHelpers] = await Promise.all([
      batchTranslate(cardLabels, payload.targetLanguage),
      batchTranslate(cardHelpers, payload.targetLanguage),
    ]);

    translatedCards = cards.map((card, index) => ({
      ...card,
      label: translatedLabels[index] || card.label,
      helper: card.helper ? (translatedHelpers[index] || card.helper) : undefined,
    }));
  }

  // Translate summary and highlights if targetLanguage is provided
  let translatedSummary = summaryParts.join(" ");
  let translatedHighlights = highlights;

  if (payload.targetLanguage && payload.targetLanguage !== "en") {
    translatedSummary = await translateText(
      translatedSummary,
      payload.targetLanguage
    );

    const highlightTitles = highlights.map((h) => h.title);
    const highlightDetails = highlights.map((h) => h.detail);

    const [translatedTitles, translatedDetails] = await Promise.all([
      batchTranslate(highlightTitles, payload.targetLanguage),
      batchTranslate(highlightDetails, payload.targetLanguage),
    ]);

    translatedHighlights = highlights.map((highlight, index) => ({
      ...highlight,
      title: translatedTitles[index] || highlight.title,
      detail: translatedDetails[index] || highlight.detail,
    }));
  }

  return {
    status: "ready",
    summary: translatedSummary,
    highlights: translatedHighlights,
    cards: translatedCards,
    meta: {
      metricMode,
      lastObservedMonth: lastMonth.key,
      lastObservedLabel: lastMonth.label,
      stalenessMonths,
      timeframeMonths: monthlyHistory.length,
      totalNotices: monthlyHistory.reduce(
        (sum, month) => sum + month.noticeCount,
        0
      ),
    },
  };
}

function determineMetric(
  history: MonthlyPoint[],
  requested?: MetricMode
): MetricMode {
  if (requested) return requested;
  return history.some((month) => month.totalValue > 0) ? "value" : "count";
}

function buildTimelineStats(
  history: MonthlyPoint[],
  mode: MetricMode
): {
  spike: { label: string; delta: number } | null;
  contraction: { delta: number } | null;
} {
  const values = history.map((point) =>
    mode === "value" ? point.totalValue : point.noticeCount
  );
  const median = computeMedian(values);
  let spike: { label: string; delta: number } | null = null;

  history.forEach((month, index) => {
    const value = values[index];
    if (median === 0) return;
    const delta = ((value - median) / median) * 100;
    if (!spike || delta > spike.delta) {
      spike = { label: month.label, delta };
    }
  });

  const lastQuarter = values.slice(-3);
  const prevQuarter = values.slice(-6, -3);
  let contraction: { delta: number } | null = null;
  if (lastQuarter.length === 3 && prevQuarter.length === 3) {
    const lastAvg =
      lastQuarter.reduce((sum, value) => sum + value, 0) / lastQuarter.length;
    const prevAvg =
      prevQuarter.reduce((sum, value) => sum + value, 0) / prevQuarter.length;
    if (prevAvg > 0) {
      contraction = { delta: ((lastAvg - prevAvg) / prevAvg) * 100 };
    }
  }

  return { spike, contraction };
}

function buildCountryStats(notices: ProcurementNoticeInput[]) {
  const totals = new Map<
    string,
    { value: number; count: number; country: string }
  >();

  for (const notice of notices) {
    const country = notice.country || "Unknown";
    const value =
      typeof notice.contractValue === "number" && notice.contractValue > 0
        ? notice.contractValue
        : 0;
    const entry = totals.get(country) ?? {
      value: 0,
      count: 0,
      country: country,
    };
    entry.value += value;
    entry.count += 1;
    totals.set(country, entry);
  }

  const totalValue = Array.from(totals.values()).reduce(
    (sum, entry) => sum + entry.value,
    0
  );

  const enriched = Array.from(totals.values()).map((entry) => ({
    ...entry,
    share: totalValue > 0 ? (entry.value / totalValue) * 100 : 0,
  }));

  enriched.sort((a, b) => b.value - a.value);
  const topCountry = enriched[0];

  const mostSurprising =
    enriched.find((entry) => entry.share > 0 && entry.share < 15) || null;

  return { topCountry, mostSurprising };
}

function buildMacroAlignment(
  countryStats: ReturnType<typeof buildCountryStats>,
  macroBudgets: ProcurementMacroEntry[]
) {
  const { topCountry } = countryStats;
  if (!topCountry) return [];

  const match = macroBudgets.find(
    (entry) =>
      entry.countryCode === topCountry.country ||
      entry.countryName === topCountry.country
  );

  if (!match) return [];

  return [
    {
      country: match.countryName,
      year: match.year,
      allocation: match.totalValueEUR,
      noticeCount: match.noticeCount,
      sampleNoticeId: match.sampleNoticeId,
      coverage:
        match.totalValueEUR > 0 ? topCountry.value / match.totalValueEUR : 0,
    },
  ];
}

function computeMedian(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function formatMetricValue(value: number, mode: MetricMode) {
  if (mode === "count") {
    return `${Math.round(value).toLocaleString("en-GB")} notices`;
  }
  if (value >= 1_000_000_000) {
    return `€${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `€${(value / 1_000).toFixed(1)}K`;
  }
  return `€${Math.round(value).toLocaleString("en-GB")}`;
}

function monthsBetween(late: Date, early: Date): number {
  return (
    (late.getUTCFullYear() - early.getUTCFullYear()) * 12 +
    (late.getUTCMonth() - early.getUTCMonth())
  );
}
