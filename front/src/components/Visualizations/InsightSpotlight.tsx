import { useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useTranslation } from "react-i18next";
import { Lightbulb, Sparkles } from "lucide-react";

import type { ProcurementNotice } from "@/types/ted";
import { buildMonthlyAggregates } from "@/lib/aggregations";
import {
  useGenerateInsightsQuery,
  type InsightCard as InsightCardPayload,
} from "@/services/insightApi";
import type { ForecastMetricMode } from "@/services/forecastApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InsightSpotlightProps {
  data: ProcurementNotice[];
}

export function InsightSpotlight({ data }: InsightSpotlightProps) {
  const { t, i18n } = useTranslation();
  const aggregates = useMemo(() => buildMonthlyAggregates(data), [data]);
  const metricHint: ForecastMetricMode = useMemo(
    () => (aggregates.some((agg) => agg.totalValue > 0) ? "value" : "count"),
    [aggregates]
  );

  const queryArgs =
    aggregates.length > 0
      ? { aggregates, notices: data, metric: metricHint, targetLanguage: i18n.language }
      : skipToken;

  const {
    data: insights,
    isFetching,
    isError,
  } = useGenerateInsightsQuery(queryArgs);

  if (isFetching) {
    return <Skeleton className="h-[220px] w-full" />;
  }

  if (!insights || isError || insights?.status === "no-data") {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <Lightbulb className="h-5 w-5" />
        <p>
          Add more filters or extend the date range to generate AI insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{t("insights.title")}</p>
          <p className="text-xs text-muted-foreground">{insights.summary}</p>
        </div>
      </div>

      {insights.highlights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {insights.highlights.map((highlight) => (
            <Badge
              key={highlight.title}
              variant={
                highlight.sentiment === "positive"
                  ? "default"
                  : highlight.sentiment === "negative"
                  ? "destructive"
                  : "outline"
              }
              className="text-xs"
            >
              {highlight.detail}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
        {insights.cards.map((card) => (
          <InsightCardTile key={card.label} card={card} />
        ))}
      </div>
    </div>
  );
}

function InsightCardTile({ card }: { card: InsightCardPayload }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        card.tone === "warning"
          ? "border-amber-500/60 bg-amber-50/40 text-amber-900 dark:bg-amber-500/10"
          : "border-border"
      )}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {card.label}
      </p>
      <p className="text-sm font-semibold">{card.value}</p>
      {card.helper && (
        <p className="text-xs text-muted-foreground">{card.helper}</p>
      )}
    </div>
  );
}
