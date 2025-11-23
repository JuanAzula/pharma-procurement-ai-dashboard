import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ProcurementNotice } from "@/types/ted";
import type { MonthlyAggregate } from "@/lib/aggregations";
import type { ForecastMetricMode } from "./forecastApi";

export interface InsightRequestBody {
  aggregates: MonthlyAggregate[];
  notices: ProcurementNotice[];
  metric?: ForecastMetricMode;
  targetLanguage?: string;
}

export interface InsightHighlight {
  title: string;
  detail: string;
  sentiment: "positive" | "negative" | "neutral";
}

export interface InsightCard {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "warning";
}

export interface InsightResponseBody {
  status: "ready" | "no-data";
  summary: string;
  highlights: InsightHighlight[];
  cards: InsightCard[];
  meta: {
    metricMode: ForecastMetricMode;
    lastObservedMonth: string;
    lastObservedLabel: string;
    stalenessMonths: number;
    timeframeMonths: number;
    totalNotices: number;
  };
}

const INSIGHTS_API_BASE_URL =
  import.meta.env.VITE_INSIGHTS_API_URL || "/api/insights";

export const insightApi = createApi({
  reducerPath: "insightApi",
  baseQuery: fetchBaseQuery({
    baseUrl: INSIGHTS_API_BASE_URL,
  }),
  endpoints: (builder) => ({
    generateInsights: builder.query<InsightResponseBody, InsightRequestBody>({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGenerateInsightsQuery } = insightApi;

