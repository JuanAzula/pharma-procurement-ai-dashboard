import { useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  setPaginationData,
  selectDisplayedNotices,
  selectAllFilteredNotices,
  selectPaginationInfo,
} from "@/store/paginationSlice";
import { useSearchNoticesQuery } from "@/services/tedApi";
import { FilterPanel } from "@/components/FilterPanel";
import { NoticesTable } from "@/components/NoticesTable";
import { TimelineChart } from "@/components/Visualizations/TimelineChart";
import { CountryComparison } from "@/components/Visualizations/CountryComparison";
import { Forecast } from "@/components/Visualizations/Forecast";
import { InsightSpotlight } from "@/components/Visualizations/InsightSpotlight";
import { ValueDistribution } from "@/components/Visualizations/ValueDistribution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, Euro, Globe, Award } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_PAGE_SIZE, FETCH_PAGE_SIZE } from "@/config/ted";
import { useTranslation } from "react-i18next";

export function Dashboard() {
  const dispatch = useAppDispatch();
  const { filters, currentPage } = useAppSelector((state) => state.filters);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Calculate API pages based on currentPage (before Redux state is updated)
  const pagesPerFetch = Math.max(
    1,
    Math.floor(FETCH_PAGE_SIZE / DEFAULT_PAGE_SIZE)
  );
  const currentApiPage = Math.max(1, Math.ceil(currentPage / pagesPerFetch));
  // Prefetch when we're on the second-to-last page of the current fetch
  // This ensures data is ready when user clicks to the last page
  // Edge case: if pagesPerFetch is 1, always prefetch
  const isSecondToLastPage =
    pagesPerFetch === 1
      ? true
      : currentPage % pagesPerFetch === pagesPerFetch - 1;
  const nextApiPage = isSecondToLastPage ? currentApiPage + 1 : null;

  // Get pagination info from Redux
  const displayedNotices = useAppSelector(selectDisplayedNotices);
  const allFilteredNotices = useAppSelector(selectAllFilteredNotices);
  const { totalNotices } = useAppSelector(selectPaginationInfo);

  // Use declarative query for main data
  const {
    data: currentData,
    error: errorCurrent,
    isFetching: isFetchingCurrent,
    isError: isErrorCurrent,
  } = useSearchNoticesQuery({
    filters,
    page: currentPage,
  });

  // Prefetch next API page if needed
  // Also check if we're on the last page of current fetch - if so, we might need the next page's data
  const isLastPageOfCurrentFetch = currentPage % pagesPerFetch === 0;
  const shouldPrefetch = nextApiPage !== null || isLastPageOfCurrentFetch;
  const prefetchPage =
    nextApiPage ||
    (isLastPageOfCurrentFetch ? currentApiPage + 1 : currentApiPage);

  // Use declarative query for prefetching with skip
  const { data: nextData } = useSearchNoticesQuery(
    {
      filters,
      page: prefetchPage,
    },
    {
      skip: !shouldPrefetch,
    }
  );

  const isLoading = isFetchingCurrent;
  const isError = isErrorCurrent;
  const error = errorCurrent;

  // Show error toast if API request fails
  useEffect(() => {
    if (isError) {
      // Ignore AbortError (happens in React Strict Mode due to double invocation)
      const isAborted =
        (error as any)?.name === "AbortError" ||
        (error as any)?.status === "CANCELED" ||
        (error as any)?.error === "Aborted";

      if (isAborted) return;

      toast({
        title: "Error fetching data",
        description:
          error instanceof Error
            ? error.message
            : t("dashboard.failedToLoad"),
        variant: "destructive",
      });
    }
  }, [isError, error, toast, t]);

  // Combine notices from current and next API pages (if available)
  // When prefetching, we combine so we can seamlessly move to the next batch
  const rawNotices = useMemo(() => {
    const current = currentData?.notices || [];
    const next = nextData?.notices || [];
    // Combine if we have prefetched data for the next API page
    // This handles both cases:
    // 1. When actively prefetching (nextApiPage is set)
    // 2. When using previously prefetched data (nextData exists from cache)
    if (next.length > 0 && (nextApiPage || nextData)) {
      return [...current, ...next];
    }
    return current;
  }, [currentData?.notices, nextData, nextApiPage]);

  const totalNoticesFromApi = currentData?.total || 0;
  const currentPageNum = currentPage;

  // Update pagination state in Redux when data changes
  useEffect(() => {
    if (currentData) {
      dispatch(
        setPaginationData({
          rawNotices,
          totalNotices: totalNoticesFromApi,
          currentPage,
          filters,
        })
      );
    }
  }, [
    rawNotices,
    totalNoticesFromApi,
    currentPage,
    filters,
    currentData,
    dispatch,
  ]);

  const metrics = useMemo(() => {
    // Calculate metrics from displayed notices only (50 items)
    // Filter notices that have valid numeric contract values
    const noticesWithValues = displayedNotices.filter(
      (n) => n.contractValue != null && n.contractValue > 0
    );

    const totalContracts = displayedNotices.length;
    const contractsWithValues = noticesWithValues.length;

    const totalValue = noticesWithValues.reduce(
      (sum, n) => sum + (n.contractValue || 0),
      0
    );

    const avgValue =
      contractsWithValues > 0 ? totalValue / contractsWithValues : 0;

    const uniqueCountries = new Set(displayedNotices.map((n) => n.country))
      .size;

    return {
      totalContracts,
      totalValue,
      avgValue,
      uniqueCountries,
      contractsWithValues,
      totalNotices,
      currentPageNum,
    };
  }, [displayedNotices, totalNotices, currentPageNum]);

  function formatEuroValue(value: number) {
    const millions = 1_000_000;
    const inMillions = value / millions;
    return `${inMillions.toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} millions`;
  }

  const analyticsAggregations = currentData?.aggregations;
  const timelineData = analyticsAggregations?.timeline ?? [];
  const countryComparisonData = analyticsAggregations?.countries ?? [];

  const analyticsDateLabel = useMemo(() => {
    const range = analyticsAggregations?.dateRange;
    if (!range) return "";

    const formatDate = (value?: string) => {
      if (!value) return "";
      try {
        return format(parseISO(value), "PPP");
      } catch {
        return value;
      }
    };

    if (range.min && range.max) {
      return `${formatDate(range.min)} – ${formatDate(range.max)}`;
    }
    if (range.min) {
      return `since ${formatDate(range.min)}`;
    }
    if (range.max) {
      return `through ${formatDate(range.max)}`;
    }
    return "";
  }, [analyticsAggregations?.dateRange]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - Filters */}
      <aside className="lg:col-span-1">
        <FilterPanel />
      </aside>

      {/* Main Content */}
      <div className="lg:col-span-3 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.totalContracts")}
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {metrics.totalContracts}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.totalValue")}
              </CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div>
                  <div className="text-2xl font-bold">
                    €{formatEuroValue(metrics.totalValue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1"></p>
                  {metrics.totalNotices > metrics.totalContracts && (
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.page")} {metrics.currentPageNum} {t("dashboard.of")}{" "}
                      {Math.ceil(metrics.totalNotices / DEFAULT_PAGE_SIZE)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.avgValue")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : metrics.contractsWithValues > 0 ? (
                <div>
                  <div className="text-2xl font-bold">
                    €{formatEuroValue(metrics.avgValue)}
                  </div>
                  {metrics.contractsWithValues < metrics.totalContracts && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics.contractsWithValues} {t("dashboard.of")} {metrics.totalContracts}{" "}
                      {t("dashboard.withValues")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-2xl font-bold text-muted-foreground">
                  N/A
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.countries")}
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">
                  {metrics.uniqueCountries}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Visualizations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {t("dashboard.procurementAnalytics")}
              {analyticsDateLabel && (
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {t("dashboard.covers")} {analyticsDateLabel}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="timeline" className="space-y-4">
              <TabsList>
                <TabsTrigger value="timeline">{t("tabs.timeline")}</TabsTrigger>
                <TabsTrigger value="comparison">{t("tabs.comparison")}</TabsTrigger>
                <TabsTrigger value="forecast">{t("tabs.forecast")}</TabsTrigger>
                <TabsTrigger value="insights">{t("tabs.insights")}</TabsTrigger>
                <TabsTrigger value="scatter">{t("tabs.scatter")}</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="space-y-4">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : timelineData.length > 0 ? (
                  <TimelineChart data={timelineData} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for visualization
                  </div>
                )}
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : countryComparisonData.length > 0 ? (
                  <CountryComparison data={countryComparisonData} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for visualization
                  </div>
                )}
              </TabsContent>

              <TabsContent value="forecast" className="space-y-4">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : allFilteredNotices.length > 0 ? (
                  <Forecast data={allFilteredNotices} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for visualization
                  </div>
                )}
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : allFilteredNotices.length > 0 ? (
                  <InsightSpotlight data={allFilteredNotices} />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No data available for insights
                  </div>
                )}
              </TabsContent>

              <TabsContent value="scatter" className="space-y-4">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : allFilteredNotices.length > 0 ? (
                  <ValueDistribution data={allFilteredNotices} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Need notices with contract values to render the scatter plot
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.procurementNotices")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isError &&
            !((error as any)?.name === "AbortError" || (error as any)?.status === "CANCELED" || (error as any)?.error === "Aborted") ? (
              <div className="flex items-center justify-center py-12 text-destructive">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{t("dashboard.failedToLoad")}</p>
              </div>
            ) : (
              <NoticesTable isLoading={isLoading} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
