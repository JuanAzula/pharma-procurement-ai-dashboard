import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CountryStat } from "@/types/ted";
import { COUNTRY_MAP } from "@/config/ted";

interface CountryComparisonProps {
  data: CountryStat[];
}

export function CountryComparison({ data }: CountryComparisonProps) {
  const chartData = useMemo(() => {
    return data.map((stat) => ({
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
            if (name === "avgValue") {
              return [
                `€${value.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`,
                "Avg Value",
              ];
            }
            return [value, name === "contracts" ? "Contracts" : name];
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
