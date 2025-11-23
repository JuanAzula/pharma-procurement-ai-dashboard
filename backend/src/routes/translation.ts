import { Router } from "express";
import { z } from "zod";
import { batchTranslate } from "../services/translationService";

const router = Router();

const translateRequestSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
    })
  ),
  targetLanguage: z.string(),
});

router.post("/notices", async (req, res) => {
  try {
    const { items, targetLanguage } = translateRequestSchema.parse(req.body);

    if (items.length === 0) {
      return res.json({});
    }

    const titles = items.map((item) => item.title);
    const descriptions = items.map((item) => item.description || "");

    // Translate in parallel
    const [translatedTitles, translatedDescriptions] = await Promise.all([
      batchTranslate(titles, targetLanguage),
      batchTranslate(descriptions, targetLanguage),
    ]);

    const result: Record<string, { title: string; description: string }> = {};

    items.forEach((item, index) => {
      result[item.id] = {
        title: translatedTitles[index] || item.title,
        description: translatedDescriptions[index] || item.description || "",
      };
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid translation request payload.",
        details: error.issues,
      });
    }
    console.error("Translation failed", error);
    res.status(500).json({ error: "Failed to translate notices." });
  }
});

export default router;
