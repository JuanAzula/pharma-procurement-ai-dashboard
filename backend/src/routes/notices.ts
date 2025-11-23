import { Router } from "express";
import { z } from "zod";
import { searchNotices } from "../services/noticeService";
import { FETCH_PAGE_SIZE } from "../config/ted";

const router = Router();

const valueRangeSchema = z
  .object({
    min: z.number().nonnegative().optional(),
    max: z.number().nonnegative().optional(),
  })
  .partial()
  .optional();

const rangeSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
  })
  .partial()
  .optional();

const filtersSchema = z.object({
  dateRange: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .partial()
    .optional(),
  countries: z.array(z.string()).optional(),
  cpvCodes: z.array(z.string()).optional(),
  suppliers: z.string().optional(),
  valueRange: valueRangeSchema,
  volumeRange: rangeSchema,
  durationRange: rangeSchema,
  targetLanguage: z.string().optional(),
});

const requestSchema = z.object({
  filters: filtersSchema.default({}),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(FETCH_PAGE_SIZE).optional(),
  targetLanguage: z.string().optional(),
});

router.post("/search", async (req, res) => {
  try {
    const payload = requestSchema.parse(req.body);
    const response = await searchNotices(payload);
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid search request payload.",
        details: error.issues,
      });
    }
    console.error("Notice search failed", error);
    res.status(500).json({ error: "Failed to fetch procurement notices." });
  }
});

export default router;

