import { Router } from "express";
import { z } from "zod";
import { generateInsights } from "../services/insightService";

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
  country: z.string().optional(),
});

const requestSchema = z.object({
  metric: z.enum(["value", "count"]).optional(),
  aggregates: z.array(aggregateSchema).optional(),
  notices: z.array(noticeSchema).optional(),
  targetLanguage: z.string().optional(),
});

router.post("/", async (req, res) => {
  try {
    const payload = requestSchema.parse(req.body);
    const hasAggregates = payload.aggregates?.length;
    const hasNotices = payload.notices?.length;

    if (!hasAggregates && !hasNotices) {
      return res.status(400).json({
        error: "Provide aggregated monthly data or individual notices.",
      });
    }

    const insights = await generateInsights(payload);
    res.json(insights);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid insight request payload.",
        details: error.issues,
      });
    }
    console.error("Insight generation failed", error);
    res.status(500).json({ error: "Failed to generate insights." });
  }
});

export default router;

