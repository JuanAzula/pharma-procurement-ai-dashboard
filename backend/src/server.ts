import express from "express";
import cors from "cors";
import forecastRouter from "./routes/forecast";
import insightsRouter from "./routes/insights";
import noticesRouter from "./routes/notices";
import translationRouter from "./routes/translation";

const PORT = Number(process.env.PORT || 4000);

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/forecast", forecastRouter);
app.use("/insights", insightsRouter);
app.use("/notices", noticesRouter);
app.use("/translate", translationRouter);

app.listen(PORT, () => {
  // Server started
});
