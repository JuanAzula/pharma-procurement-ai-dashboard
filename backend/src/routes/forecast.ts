import { Router } from "express";
import { z } from "zod";
import { buildForecast } from "../services/forecastService";

const router = Router();

const aggregateSchema = z.object({
  month: z.string(),
  label: z.string().optional(),
  totalValue: z.number().nonnegative().optional(),
  noticeCount: z.number().int().nonnegative().optional(),
});

const noticeSchema = z.object({
  awardDate: z.string(),
  contractValue: z.number().nonnegative().optional(),
});

const requestSchema = z.object({
  horizon: z.number().int().min(1).max(24).optional(),
  metric: z.enum(["value", "count"]).optional(),
  aggregates: z.array(aggregateSchema).optional(),
  notices: z.array(noticeSchema).optional(),
  fillMissingMonths: z.boolean().optional(),
  lockToCurrentMonth: z.boolean().optional(),
  targetLanguage: z.string().optional(),
});

router.post("/", async (req, res) => {
  try {
    const payload = requestSchema.parse(req.body);
    const hasAggregates = payload.aggregates && payload.aggregates.length > 0;
    const hasNotices = payload.notices && payload.notices.length > 0;

    if (!hasAggregates && !hasNotices) {
      return res.status(400).json({
        error: "Provide either aggregated monthly data or individual notices.",
      });
    }

    const forecast = await buildForecast(payload);
    res.json(forecast);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid forecast request payload.",
        details: error.issues,
      });
    }
    console.error("Forecast generation failed", error);
    res.status(500).json({ error: "Failed to generate forecast." });
  }
});

export default router;

