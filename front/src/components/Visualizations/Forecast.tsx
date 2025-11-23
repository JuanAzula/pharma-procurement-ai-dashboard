import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Clock } from "lucide-react";

import type { ProcurementNotice } from "@/types/ted";
import {
  useGenerateForecastQuery,
  type ForecastAggregatePayload,
  type ForecastMetricMode,
  type ForecastResponseBody,
  type ForecastSeriesPoint,
} from "@/services/forecastApi";
import { buildMonthlyAggregates } from "@/lib/aggregations";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ForecastProps {
  data: ProcurementNotice[];
}

interface ChartDatum {
  key: string;
  label: string;
  actual: number | null;
  forecast: number | null;
  isFuture: boolean;
  isGap?: boolean;
}

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function Forecast({ data }: ForecastProps) {
  const { t, i18n } = useTranslation();
  const [horizon, setHorizon] = useState(6);
  const [fillMissingMonths, setFillMissingMonths] = useState(true);
  const [lockToCurrentMonth, setLockToCurrentMonth] = useState(true);

  const aggregates = useMemo(() => buildAggregates(data), [data]);

  const metricHint: ForecastMetricMode = useMemo(
    () => (aggregates.some((agg) => agg.totalValue > 0) ? "value" : "count"),
    [aggregates]
  );

  const forecastArgs =
    aggregates.length > 0
      ? {
          aggregates,
          metric: metricHint,
          horizon,
          fillMissingMonths,
          lockToCurrentMonth,
          targetLanguage: i18n.language,
        }
      : skipToken;

  const {
    data: forecast,
    isFetching,
    isError,
    error,
  } = useGenerateForecastQuery(forecastArgs);

  const metricMode = forecast?.metricMode ?? metricHint;
  const chartData = useMemo(
    () => mapSeriesToChart(forecast?.series ?? []),
    [forecast?.series]
  );

  const summary = buildSummary({
    forecast,
    isFetching,
    isError,
    aggregatesEmpty: aggregates.length === 0,
  });

  const showSkeleton = isFetching && chartData.length === 0;
  const showEmptyState =
    aggregates.length === 0 ||
    forecast?.status === "no-data" ||
    forecast?.status === "insufficient-data" ||
    (!isFetching && chartData.length === 0);

  const gapHighlight = useMemo(() => {
    if (!forecast?.meta?.gapRange) return null;
    const startLabel = chartData.find(
      (point) => point.key === forecast.meta.gapRange?.start
    )?.label;
    const endLabel = chartData.find(
      (point) => point.key === forecast.meta.gapRange?.end
    )?.label;
    if (!startLabel || !endLabel) return null;
    return { startLabel, endLabel };
  }, [chartData, forecast?.meta?.gapRange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{t("forecast.title")}</p>
          <p className="text-xs text-muted-foreground">{summary}</p>
        </div>
        <Badge variant="outline" className="text-xs uppercase tracking-wide">
          {metricMode === "value" ? t("forecast.totalContractValue") : t("forecast.awardedNotices")}
        </Badge>
      </div>

      <ControlBar
        horizon={horizon}
        onHorizonChange={setHorizon}
        fillMissing={fillMissingMonths}
        onToggleFill={() => setFillMissingMonths((state) => !state)}
        lockToCurrent={lockToCurrentMonth}
        onToggleLock={() => setLockToCurrentMonth((state) => !state)}
        disabled={aggregates.length === 0 || isFetching}
      />

      {forecast?.meta && (
        <MetaStrip meta={forecast.meta} status={forecast.status} />
      )}

      {forecast?.meta?.isStale && (
        <StalenessWarning meta={forecast.meta} />
      )}

      {showSkeleton ? (
        <Skeleton className="h-[320px] w-full" />
      ) : showEmptyState ? (
        <EmptyState
          status={forecast?.status}
          message={
            aggregates.length === 0
              ? "Add more filters or extend the date range to generate a forecast."
              : forecast?.summary ?? "Not enough information to render the forecast."
          }
        />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value: number) => formatYAxis(value, metricMode)} />
            <Tooltip
              formatter={(value: number, name) =>
                formatTooltip(value, name, metricMode)
              }
              labelFormatter={(label) => String(label)}
            />
            <Legend />
            {gapHighlight && (
              <ReferenceArea
                x1={gapHighlight.startLabel}
                x2={gapHighlight.endLabel}
                label={{ value: "Data gap", position: "insideTop" }}
                fill="hsl(var(--muted))"
                fillOpacity={0.25}
                strokeOpacity={0}
              />
            )}
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#2563eb"
              fill="#93c5fd"
              fillOpacity={0.4}
              activeDot={{ r: 5 }}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke="#f97316"
              fill="#fdba74"
              fillOpacity={0.25}
              strokeDasharray="6 6"
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {isError && (
        <p className="text-xs text-destructive">
          Unable to reach the forecast service. {getErrorMessage(error)}
        </p>
      )}
    </div>
  );
}

function ControlBar({
  horizon,
  onHorizonChange,
  fillMissing,
  onToggleFill,
  lockToCurrent,
  onToggleLock,
  disabled,
}: {
  horizon: number;
  onHorizonChange: (value: number) => void;
  fillMissing: boolean;
  onToggleFill: () => void;
  lockToCurrent: boolean;
  onToggleLock: () => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <div className="space-y-1">
        <p className="font-semibold">{t("forecast.horizonLabel")}</p>
        <Select
          value={String(horizon)}
          onValueChange={(value) => onHorizonChange(Number(value))}
          disabled={disabled}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select horizon" />
          </SelectTrigger>
          <SelectContent>
            {[3, 6, 12].map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} {t("forecast.months")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        size="sm"
        variant={"outline"}
        disabled={disabled}
        onClick={onToggleFill}
        className={fillMissing ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100" : ""}
      >
        {t("forecast.fillMissing")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={"outline"}
        disabled={disabled}
        onClick={onToggleLock}
        className={lockToCurrent ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100" : ""}
      >
        {t("forecast.anchorToday")}
      </Button>
    </div>
  );
}

function MetaStrip({
  meta,
  status,
}: {
  meta: ForecastResponseBody["meta"];
  status?: ForecastResponseBody["status"];
}) {
  const { t } = useTranslation();
  const cards = [
    {
      label: t("forecast.lastAwarded"),
      value: meta.lastObservedLabel ?? "N/A",
      helper: meta.stalenessMonths
        ? `${meta.stalenessMonths} ${t("forecast.monthGap")}`
        : t("forecast.recentMonth"),
      tone: meta.isStale ? ("warning" as const) : ("default" as const),
    },
    {
      label: t("forecast.forecastWindow"),
      value:
        meta.forecastStartLabel && meta.forecastEndLabel
          ? `${meta.forecastStartLabel} → ${meta.forecastEndLabel}`
          : status === "insufficient-data"
          ? "Need more history"
          : "Pending",
      helper: `${t("forecast.horizon")}: ${meta.horizon} ${t("forecast.mo")}`,
    },
    {
      label: t("forecast.trainingSamples"),
      value: meta.trainingSamples.toString(),
      helper: t("forecast.monthlyObservations"),
    },
    {
      label: t("forecast.gapFilled"),
      value: meta.gapMonths ? `${meta.gapMonths} ${t("forecast.months")}` : t("forecast.none"),
      helper: meta.gapMonths ? t("forecast.shadedZone") : undefined,
    },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <MetaCard key={card.label} {...card} />
      ))}
    </div>
  );
}

function MetaCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tone === "warning"
          ? "border-amber-500/60 bg-amber-50/40 text-amber-900 dark:bg-amber-500/10"
          : "border-border"
      )}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

function StalenessWarning({
  meta,
}: {
  meta: ForecastResponseBody["meta"];
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-50/40 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
      <AlertTriangle className="mt-0.5 h-4 w-4" />
      <div>
        <p className="font-semibold">
          {t("forecast.oldData")} {meta.lastObservedLabel ?? "N/A"}
        </p>
        <p>
          {t("forecast.noAwardsDetected", { count: meta.stalenessMonths })}
        </p>
      </div>
    </div>
  );
}

function buildSummary({
  forecast,
  isFetching,
  isError,
  aggregatesEmpty,
}: {
  forecast?: ForecastResponseBody;
  isFetching: boolean;
  isError: boolean;
  aggregatesEmpty: boolean;
}) {
  if (forecast?.summary) return forecast.summary;
  if (aggregatesEmpty) {
    return "Need at least one awarded notice to analyze.";
  }
  if (isFetching) {
    return "Consulting AI forecast service...";
  }
  if (isError) {
    return "Unable to reach the AI forecast service.";
  }
  return "Forecast will appear once data is available.";
}

function buildAggregates(
  notices: ProcurementNotice[]
): ForecastAggregatePayload[] {
  return buildMonthlyAggregates(notices);
}

function mapSeriesToChart(series: ForecastSeriesPoint[]): ChartDatum[] {
  return series.map((point) => ({
    key: point.key,
    label: point.month,
    actual: point.actual ?? null,
    forecast: point.forecast ?? null,
    isFuture: point.isFuture,
    isGap: point.isGap,
  }));
}

function formatYAxis(value: number, mode: ForecastMetricMode) {
  if (mode === "count") {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return `${value}`;
  }
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return `${value}`;
}

function formatTooltip(
  value: number,
  name: string | number,
  mode: ForecastMetricMode
) {
  const seriesLabel =
    typeof name === "string"
      ? name
      : typeof name === "number"
      ? String(name)
      : "value";
  if (value == null) return value;
  if (mode === "value") {
    return [
      currencyFormatter.format(value),
      seriesLabel === "actual" ? "Actual" : "Forecast",
    ];
  }
  return [
    `${Math.round(value).toLocaleString("en-GB")} notices`,
    seriesLabel === "actual" ? "Actual" : "Forecast",
  ];
}

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return `Status ${(error as { status: number }).status}`;
  }
  return "";
}

function EmptyState({
  status,
  message,
}: {
  status?: ForecastResponseBody["status"];
  message: string;
}) {
  return (
    <div className="flex h-[280px] w-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
      {status === "insufficient-data" ? (
        <>
          <Clock className="h-5 w-5" />
          <p>Need at least three months of awarded notices to train the model.</p>
        </>
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
}
