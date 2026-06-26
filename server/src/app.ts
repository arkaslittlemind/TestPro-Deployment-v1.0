import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import comparatorRoutes from "./routes/comparatorRoutes";
import { metricsRegistry } from "./utils/metrics";

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  } catch (error) {
    res.status(500).end(String(error));
  }
});

app.use("/api/v1", comparatorRoutes);

export default app;
