import { Request, Response } from "express";
import { loadTestService } from "../services/LoadTestService";
import { ApiRequestConfig } from "../types/comparator.types";
import logger from "../utils/logger";
import { loadTestCounter } from "../utils/metrics";

export class LoadTestController {
  public async run(req: Request, res: Response): Promise<void> {
    try {
      const { muleConfig, sapConfig, concurrency } = req.body as {
        muleConfig: ApiRequestConfig;
        sapConfig: ApiRequestConfig;
        concurrency: number;
      };

      const isValidHttpConfig = (config: ApiRequestConfig) =>
        config &&
        config.inputType !== "raw" &&
        typeof config.url === "string" &&
        config.url.trim() !== "";

      if (!isValidHttpConfig(muleConfig) || !isValidHttpConfig(sapConfig)) {
        logger.warn("Invalid configuration provided for load test");
        res.status(400).json({
          status: "error",
          message:
            "Invalid configuration. Both endpoints must provide a URL in HTTP Request mode.",
        });
        return;
      }

      if (typeof concurrency !== "number") {
        res.status(400).json({
          status: "error",
          message: "A numeric concurrency value is required.",
        });
        return;
      }

      const result = await loadTestService.runLoadTest(
        muleConfig,
        sapConfig,
        concurrency,
      );

      logger.info(
        {
          concurrency: result.concurrency,
          durationMs: result.durationMs,
          muleSuccess: result.mulesoft.success,
          sapSuccess: result.sapBtp.success,
        },
        "Load test completed successfully",
      );

      loadTestCounter.inc({
        concurrency: String(concurrency),
        status: "success",
      });

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";

      logger.error({ err: error }, "An error occurred while running load test");

      loadTestCounter.inc({
        concurrency: String(req.body?.concurrency ?? "unknown"),
        status: "error",
      });

      const statusCode = message.includes("Invalid concurrency") ? 400 : 500;

      res.status(statusCode).json({
        status: "error",
        message,
      });
    }
  }
}

export const loadTestController = new LoadTestController();
