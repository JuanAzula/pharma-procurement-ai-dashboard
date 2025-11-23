import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import type { ProcurementNotice } from "@/types/ted";
import { COUNTRY_MAP } from "@/config/ted";
import { parseISO } from "date-fns";

interface ValueDistributionProps {
  data: ProcurementNotice[];
}

export function ValueDistribution({ data }: ValueDistributionProps) {
  const chartData = useMemo(() => {
    return data
      .filter((notice) => notice.contractValue && notice.awardDate)
      .map((notice) => {
        try {
          const date = parseISO(notice.awardDate);
          return {
            date: date.getTime(),
            value: notice.contractValue,
            country: notice.country,
            countryName: COUNTRY_MAP[notice.country] || notice.country,
            title: notice.title,
          };
        } catch {
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [data]);

  const countries = useMemo(() => {
    return Array.from(new Set(chartData.map((d) => d.country)));
  }, [chartData]);

  const colors: Record<string, string> = {
    DEU: "#3b82f6",
    HUN: "#ef4444",
    ITA: "#10b981",
    POL: "#f59e0b",
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
          name="Award Date"
        />
        <YAxis
          dataKey="value"
          type="number"
          name="Contract Value"
          tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
        />
        <ZAxis range={[50, 200]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                  <p className="font-semibold">{data.countryName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(data.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-medium">
                    Value: €{data.value?.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs truncate">
                    {data.title}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend formatter={(value) => COUNTRY_MAP[value] || value} />
        {countries.map((country) => (
          <Scatter
            key={country}
            name={country}
            data={chartData.filter((d) => d.country === country)}
            fill={colors[country] || "#94a3b8"}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
