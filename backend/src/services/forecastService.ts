import util from "util";
import type { Tensor } from "@tensorflow/tfjs-node";
import {
  MetricMode,
  ProcurementNoticeInput,
  MonthlyAggregateInput,
  MonthlyPoint,
  buildMonthlyHistory,
  formatLabel,
  formatMonthKey,
  startOfMonthUTC,
  addMonths,
} from "./aggregations";
import { translateText } from "./translationService";

export interface ForecastRequestPayload {
  notices?: ProcurementNoticeInput[];
  aggregates?: MonthlyAggregateInput[];
  metric?: MetricMode;
  horizon?: number;
  fillMissingMonths?: boolean;
  lockToCurrentMonth?: boolean;
  targetLanguage?: string;
}

export interface ForecastSeriesPoint {
  key: string;
  month: string;
  actual: number | null;
  forecast: number | null;
  isFuture: boolean;
  isGap?: boolean;
}

export interface ForecastResponse {
  status: "ready" | "insufficient-data" | "no-data" | "error";
  metricMode: MetricMode;
  summary: string;
  series: ForecastSeriesPoint[];
  meta: {
    horizon: number;
    generatedAt: string;
    trainingSamples: number;
    anchorMonth: string | null;
    forecastStartLabel: string | null;
    forecastEndLabel: string | null;
    lastObservedMonth: string | null;
    lastObservedLabel: string | null;
    stalenessMonths: number;
    staleThreshold: number;
    isStale: boolean;
    gapMonths: number;
    gapRange: { start: string; end: string } | null;
  };
}

const MIN_OBSERVATIONS = 3;
const DEFAULT_HORIZON = 6;
const MAX_HORIZON = 24;
const STALE_THRESHOLD_MONTHS = 6;

type TfModule = typeof import("@tensorflow/tfjs-node");
let tfModulePromise: Promise<TfModule> | null = null;

type NodeUtilPatched = typeof import("util") & {
  isNullOrUndefined?: (value: unknown) => value is null | undefined;
};

const nodeUtil = util as NodeUtilPatched;

if (typeof nodeUtil.isNullOrUndefined !== "function") {
  nodeUtil.isNullOrUndefined = (
    value: unknown
  ): value is null | undefined => value === null || value === undefined;
}

async function loadTf(): Promise<TfModule> {
  if (!tfModulePromise) {
    tfModulePromise = import("@tensorflow/tfjs-node");
  }
  return tfModulePromise;
}

export async function buildForecast(
  payload: ForecastRequestPayload
): Promise<ForecastResponse> {
  const tf = await loadTf();
  const monthlyHistory = buildMonthlyHistory(
    payload.aggregates,
    payload.notices
  );

  const requestedHorizon = payload.horizon ?? DEFAULT_HORIZON;

  if (monthlyHistory.length === 0) {
    return {
      status: "no-data",
      metricMode: payload.metric ?? "count",
      summary: "No awarded notices available for the selected filters.",
      series: [],
      meta: {
        horizon: requestedHorizon,
        generatedAt: new Date().toISOString(),
        trainingSamples: 0,
        anchorMonth: null,
        forecastStartLabel: null,
        forecastEndLabel: null,
        lastObservedMonth: null,
        lastObservedLabel: null,
        stalenessMonths: 0,
        staleThreshold: STALE_THRESHOLD_MONTHS,
        isStale: false,
        gapMonths: 0,
        gapRange: null,
      },
    };
  }

  const metricMode = determineMetric(monthlyHistory, payload.metric);
  const trainingHistory =
    metricMode === "value"
      ? monthlyHistory.filter((month) => month.totalValue > 0)
      : monthlyHistory;

  const displayHistory: ForecastSeriesPoint[] = monthlyHistory.map(
    (month) => ({
      key: month.key,
      month: month.label,
      actual:
        metricMode === "value"
          ? Math.round(month.totalValue)
          : month.noticeCount,
      forecast: null,
      isFuture: false,
    })
  );

  const horizon = clamp(requestedHorizon, 1, MAX_HORIZON);
  const lastRecordedDate = monthlyHistory[monthlyHistory.length - 1].date;
  const todayStart = startOfMonthUTC(new Date());
  const lockToCurrent = payload.lockToCurrentMonth ?? true;
  const anchorBase =
    lockToCurrent && todayStart > lastRecordedDate
      ? todayStart
      : addMonths(lastRecordedDate, 1);

  const shouldFillGaps = payload.fillMissingMonths ?? true;
  const gapDates =
    shouldFillGaps && anchorBase > lastRecordedDate
      ? collectGapDates(lastRecordedDate, anchorBase)
      : [];
  const gapHistory: ForecastSeriesPoint[] = gapDates.map((date) => ({
    key: formatMonthKey(date),
    month: formatLabel(date),
    actual: 0,
    forecast: null,
    isFuture: false,
    isGap: true,
  }));

  const historyPoints = [...displayHistory, ...gapHistory];

  if (historyPoints.length > 0) {
    const lastIndex = historyPoints.length - 1;
    historyPoints[lastIndex] = {
      ...historyPoints[lastIndex],
      forecast: historyPoints[lastIndex].actual,
    };
  }

  const stalenessMonths = monthsBetween(todayStart, lastRecordedDate);
  const isStale = stalenessMonths >= STALE_THRESHOLD_MONTHS;

  if (trainingHistory.length < MIN_OBSERVATIONS) {
    return {
      status: "insufficient-data",
      metricMode,
      summary:
        "At least three months of historical data with values are required for AI forecasting.",
      series: historyPoints,
      meta: buildMeta({
        horizon,
        trainingSamples: trainingHistory.length,
        forecastStart: null,
        forecastEnd: null,
        lastRecordedDate,
        gapDates,
        isStale,
        stalenessMonths,
      }),
    };
  }

  const xs = trainingHistory.map((point) => point.date.getTime());
  const ys = trainingHistory.map((point) =>
    metricMode === "value"
      ? Math.max(point.totalValue, 0)
      : point.noticeCount
  );
  const xScale = Math.max(...xs) || 1;
  const yScale = Math.max(...ys) || 1;
  const normalizedXs = xs.map((x) => x / xScale);
  const normalizedYs = ys.map((y) => y / yScale);

  const xsTensor = tf.tensor2d(normalizedXs, [normalizedXs.length, 1]);
  const ysTensor = tf.tensor2d(normalizedYs, [normalizedYs.length, 1]);

  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      units: 32,
      activation: "relu",
      inputShape: [1],
    })
  );
  model.add(tf.layers.dropout({ rate: 0.1 }));
  model.add(tf.layers.dense({ units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({
    optimizer: tf.train.adam(0.05),
    loss: "meanSquaredError",
  });

  await model.fit(xsTensor, ysTensor, {
    epochs: Math.min(250, 40 * normalizedXs.length),
    shuffle: true,
    verbose: 0,
  });

  const forecastStartDate = anchorBase;
  const forecastDates = Array.from({ length: horizon }, (_, index) =>
    addMonths(forecastStartDate, index)
  );

  const futurePoints: ForecastSeriesPoint[] = [];

  for (const date of forecastDates) {
    const normalizedInput = date.getTime() / xScale;
    const inputTensor = tf.tensor2d([normalizedInput], [1, 1]);
    const predictionTensor = model.predict(inputTensor) as Tensor;
    const predictionArray = await predictionTensor.data();
    const prediction = Math.max(0, predictionArray[0] * yScale);
    futurePoints.push({
      key: formatMonthKey(date),
      month: formatLabel(date),
      actual: null,
      forecast: Math.round(prediction),
      isFuture: true,
    });
    inputTensor.dispose();
    predictionTensor.dispose();
  }

  xsTensor.dispose();
  ysTensor.dispose();
  model.dispose();

  const summaryWindow = futurePoints.slice(0, Math.min(3, futurePoints.length));
  const lastActual = historyPoints.at(-1)?.actual ?? 0;
  const upcomingAverage =
    summaryWindow.reduce((sum, point) => sum + (point.forecast ?? 0), 0) /
    (summaryWindow.length || 1);
  const trend =
    lastActual > 0 ? ((upcomingAverage - lastActual) / lastActual) * 100 : null;

  const direction =
    trend === null
      ? "stabilize"
      : trend >= 0
      ? `grow by ${trend.toFixed(1)}%`
      : `decline by ${Math.abs(trend).toFixed(1)}%`;

  const freshnessNote = isStale
    ? ` Latest award month is ${formatLabel(lastRecordedDate)} (${stalenessMonths} months old).`
    : "";
  const gapNote = gapDates.length
    ? ` Filled ${gapDates.length} missing month${gapDates.length > 1 ? "s" : ""} to reach the present.`
    : "";

  const summary =
    `AI model expects ${
      metricMode === "value" ? "monthly spend" : "notice volume"
    } to ${direction}, averaging ${formatMetricValue(
      upcomingAverage,
      metricMode
    )} over the next quarter.` + freshnessNote + gapNote;

  // Translate summary if targetLanguage is provided
  const translatedSummary =
    payload.targetLanguage && payload.targetLanguage !== "en"
      ? await translateText(summary, payload.targetLanguage)
      : summary;

  return {
    status: "ready",
    metricMode,
    summary: translatedSummary,
    series: [...historyPoints, ...futurePoints],
    meta: buildMeta({
      horizon,
      trainingSamples: trainingHistory.length,
      forecastStart: forecastStartDate,
      forecastEnd: futurePoints.at(-1)?.month ?? null,
      lastRecordedDate,
      gapDates,
      isStale,
      stalenessMonths,
    }),
  };
}

function buildMeta({
  horizon,
  trainingSamples,
  forecastStart,
  forecastEnd,
  lastRecordedDate,
  gapDates,
  isStale,
  stalenessMonths,
}: {
  horizon: number;
  trainingSamples: number;
  forecastStart: Date | null;
  forecastEnd: string | null;
  lastRecordedDate: Date;
  gapDates: Date[];
  isStale: boolean;
  stalenessMonths: number;
}) {
  return {
    horizon,
    generatedAt: new Date().toISOString(),
    trainingSamples,
    anchorMonth: forecastStart ? formatMonthKey(forecastStart) : null,
    forecastStartLabel: forecastStart ? formatLabel(forecastStart) : null,
    forecastEndLabel: forecastEnd ?? null,
    lastObservedMonth: formatMonthKey(lastRecordedDate),
    lastObservedLabel: formatLabel(lastRecordedDate),
    stalenessMonths,
    staleThreshold: STALE_THRESHOLD_MONTHS,
    isStale,
    gapMonths: gapDates.length,
    gapRange: gapDates.length
      ? {
          start: formatMonthKey(gapDates[0]),
          end: formatMonthKey(gapDates[gapDates.length - 1]),
        }
      : null,
  };
}

function determineMetric(
  history: MonthlyPoint[],
  requested?: MetricMode
): MetricMode {
  if (requested) return requested;
  return history.some((month) => month.totalValue > 0) ? "value" : "count";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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

function collectGapDates(lastRecorded: Date, anchor: Date): Date[] {
  const gaps: Date[] = [];
  if (anchor <= lastRecorded) {
    return gaps;
  }
  let cursor = addMonths(lastRecorded, 1);
  while (cursor < anchor) {
    gaps.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return gaps;
}

function monthsBetween(late: Date, early: Date): number {
  return (
    (late.getUTCFullYear() - early.getUTCFullYear()) * 12 +
    (late.getUTCMonth() - early.getUTCMonth())
  );
}
