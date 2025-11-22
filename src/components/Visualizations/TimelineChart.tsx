import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ProcurementNotice } from '@/types/ted';
import { COUNTRY_MAP } from '@/config/ted';
import { format, parseISO } from 'date-fns';

interface TimelineChartProps {
  data: ProcurementNotice[];
}

export function TimelineChart({ data }: TimelineChartProps) {
  const chartData = useMemo(() => {
    // Group by month and country
    const groupedData: Record<string, Record<string, number>> = {};

    data.forEach((notice) => {
      if (!notice.awardDate) return;

      try {
        const date = parseISO(notice.awardDate);
        const monthKey = format(date, 'yyyy-MM');
        const country = notice.country;

        if (!groupedData[monthKey]) {
          groupedData[monthKey] = {};
        }

        groupedData[monthKey][country] =
          (groupedData[monthKey][country] || 0) + 1;
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Convert to array format for Recharts
    return Object.entries(groupedData)
      .map(([month, countries]) => ({
        month,
        ...countries,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  const countries = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.country))).filter(Boolean);
  }, [data]);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickFormatter={(value) => {
            try {
              return format(parseISO(`${value}-01`), 'MMM yyyy');
            } catch {
              return value;
            }
          }}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(value) => {
            try {
              return format(parseISO(`${value}-01`), 'MMMM yyyy');
            } catch {
              return value;
            }
          }}
        />
        <Legend
          formatter={(value) => COUNTRY_MAP[value as string] || value}
        />
        {countries.map((country, index) => (
          <Line
            key={country}
            type="monotone"
            dataKey={country}
            stroke={colors[index % colors.length]}
            name={country}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

