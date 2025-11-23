import { useMemo } from "react";
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
import type { TimelineBucket } from "@/types/ted";
import { COUNTRY_MAP } from "@/config/ted";
import { format, parseISO } from "date-fns";

interface TimelineChartProps {
  data: TimelineBucket[];
}

export function TimelineChart({ data }: TimelineChartProps) {
  const chartData = useMemo(() => {
    return data.map((bucket) => ({
      month: bucket.month,
      ...bucket.counts,
    }));
  }, [data]);

  const countries = useMemo(() => {
    const unique = new Set<string>();
    data.forEach((bucket) => {
      Object.keys(bucket.counts || {}).forEach((country) => {
        if (country) unique.add(country);
      });
    });
    return Array.from(unique);
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
              return format(parseISO(`${value}-01`), "MMMM yyyy");
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

