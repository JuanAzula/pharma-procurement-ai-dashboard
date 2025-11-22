import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ProcurementNotice } from '@/types/ted';
import { COUNTRY_MAP } from '@/config/ted';

interface CountryComparisonProps {
  data: ProcurementNotice[];
}

export function CountryComparison({ data }: CountryComparisonProps) {
  const chartData = useMemo(() => {
    const countryStats: Record<
      string,
      { country: string; contracts: number; totalValue: number; avgValue: number }
    > = {};

    data.forEach((notice) => {
      const country = notice.country;
      if (!country) return;

      if (!countryStats[country]) {
        countryStats[country] = {
          country,
          contracts: 0,
          totalValue: 0,
          avgValue: 0,
        };
      }

      countryStats[country].contracts += 1;
      if (notice.contractValue) {
        countryStats[country].totalValue += notice.contractValue;
      }
    });

    // Calculate averages
    Object.values(countryStats).forEach((stat) => {
      stat.avgValue = stat.contracts > 0 ? stat.totalValue / stat.contracts : 0;
    });

    return Object.values(countryStats).map((stat) => ({
      ...stat,
      countryName: COUNTRY_MAP[stat.country] || stat.country,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="countryName" />
        <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
        <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === 'avgValue') {
              return [`€${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Avg Value'];
            }
            return [value, name === 'contracts' ? 'Contracts' : name];
          }}
        />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="contracts"
          fill="#3b82f6"
          name="Number of Contracts"
        />
        <Bar
          yAxisId="right"
          dataKey="avgValue"
          fill="#10b981"
          name="Average Contract Value (EUR)"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

