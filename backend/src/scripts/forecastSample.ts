import { buildForecast } from "../services/forecastService";

async function run() {
  const sample = await buildForecast({
    aggregates: [
      { month: "2024-05", totalValue: 750000, noticeCount: 6 },
      { month: "2024-06", totalValue: 615000, noticeCount: 5 },
      { month: "2024-07", totalValue: 980000, noticeCount: 7 },
      { month: "2024-08", totalValue: 820000, noticeCount: 4 },
      { month: "2024-09", totalValue: 1030000, noticeCount: 8 },
    ],
  });

  console.log("Forecast summary:", sample.summary);
  console.log(
    "First five points:",
    sample.series.slice(0, 5).map((point) => ({
      month: point.month,
      actual: point.actual,
      forecast: point.forecast,
      future: point.isFuture,
    }))
  );
}

run().catch((error) => {
  console.error("Sample forecast failed:", error);
  process.exit(1);
});

