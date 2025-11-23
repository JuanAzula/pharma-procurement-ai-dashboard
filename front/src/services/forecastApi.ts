import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { MonthlyAggregate } from "@/lib/aggregations";

export type ForecastMetricMode = "value" | "count";

export type ForecastAggregatePayload = MonthlyAggregate;

export interface ForecastRequestBody {
  aggregates: ForecastAggregatePayload[];
  metric?: ForecastMetricMode;
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

export interface ForecastResponseBody {
  status: "ready" | "insufficient-data" | "no-data" | "error";
  metricMode: ForecastMetricMode;
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

const FORECAST_API_BASE_URL =
  import.meta.env.VITE_FORECAST_API_URL || "/api/forecast";

export const forecastApi = createApi({
  reducerPath: "forecastApi",
  baseQuery: fetchBaseQuery({
    baseUrl: FORECAST_API_BASE_URL,
  }),
  endpoints: (builder) => ({
    generateForecast: builder.query<ForecastResponseBody, ForecastRequestBody>({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGenerateForecastQuery } = forecastApi;

