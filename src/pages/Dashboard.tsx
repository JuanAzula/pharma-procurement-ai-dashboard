import { useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentPage } from '@/store/filterSlice';
import { useSearchNoticesQuery } from '@/services/tedApi';
import { FilterPanel } from '@/components/FilterPanel';
import { NoticesTable } from '@/components/NoticesTable';
import { TimelineChart } from '@/components/Visualizations/TimelineChart';
import { CountryComparison } from '@/components/Visualizations/CountryComparison';
import { ValueDistribution } from '@/components/Visualizations/ValueDistribution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, Euro, Globe, Award } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function Dashboard() {
  const dispatch = useAppDispatch();
  const { filters, currentPage } = useAppSelector((state) => state.filters);
  const { toast } = useToast();

  const { data, isLoading, isError, error } = useSearchNoticesQuery({
    filters,
    page: currentPage,
  });

  // Show error toast if API request fails
  useMemo(() => {
    if (isError) {
      toast({
        title: 'Error fetching data',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to fetch procurement notices. Please try again.',
        variant: 'destructive',
      });
    }
  }, [isError, error, toast]);

  const notices = data?.notices || [];

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalContracts = notices.length;
    const totalValue = notices.reduce(
      (sum, n) => sum + (n.contractValue || 0),
      0
    );
    const avgValue = totalContracts > 0 ? totalValue / totalContracts : 0;
    const uniqueCountries = new Set(notices.map((n) => n.country)).size;

    return {
      totalContracts,
      totalValue,
      avgValue,
      uniqueCountries,
    };
  }, [notices]);

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

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
                Total Contracts
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
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  €{(metrics.totalValue / 1000000).toFixed(1)}M
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Value
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  €{(metrics.avgValue / 1000).toFixed(0)}k
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Countries</CardTitle>
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
            <CardTitle>Procurement Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="timeline" className="space-y-4">
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="comparison">Country Comparison</TabsTrigger>
                <TabsTrigger value="distribution">
                  Value Distribution
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="space-y-4">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : notices.length > 0 ? (
                  <TimelineChart data={notices} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for visualization
                  </div>
                )}
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : notices.length > 0 ? (
                  <CountryComparison data={notices} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for visualization
                  </div>
                )}
              </TabsContent>

              <TabsContent value="distribution" className="space-y-4">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : notices.length > 0 ? (
                  <ValueDistribution data={notices} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for visualization
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Procurement Notices</CardTitle>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="flex items-center justify-center py-12 text-destructive">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>Failed to load procurement notices. Please try again.</p>
              </div>
            ) : (
              <NoticesTable
                data={notices}
                isLoading={isLoading}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

