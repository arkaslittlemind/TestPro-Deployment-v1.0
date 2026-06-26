import { Request, Response } from "express";
import { comparatorService } from "../services/ComparatorService";
import { ApiRequestConfig } from "../types/comparator.types";
import logger from "../utils/logger";
import { comparisonCounter, matchCounter } from "../utils/metrics";

export class ComparatorController {
  public async compare(req: Request, res: Response): Promise<void> {
    // console.log("🚨🚨🚨 parsePayload IS ACTUALLY RUNNING! 🚨🚨🚨");
    try {
      const { muleConfig, sapConfig } = req.body as {
        muleConfig: ApiRequestConfig;
        sapConfig: ApiRequestConfig;
      };

      const isValidConfig = (config: ApiRequestConfig) => {
        if (!config) return false;
        if (config.inputType === "raw") {
          return (
            typeof config.rawPayload === "string" &&
            config.rawPayload.trim() !== ""
          );
        }
        return typeof config.url === "string" && config.url.trim() !== "";
      };

      if (!isValidConfig(muleConfig) || !isValidConfig(sapConfig)) {
        logger.warn("Invalid configuration provided for comparison");
        res.status(400).json({
          status: "error",
          message:
            "Invalid configuration. Both endpoints must provide either a URL (for HTTP) or a pasted payload (for Raw).",
        });
        return;
      }

      const result = await comparatorService.compareEndpoints(
        muleConfig,
        sapConfig,
      );

      logger.info(
        {
          isExactMatch: result.isExactMatch,
          discrepancyCount: result.differences.length,
          muleMode: muleConfig.inputType,
          sapMode: sapConfig.inputType,
        },
        "Comparison completed successfully",
      );

      comparisonCounter.inc({
        status: "success",
        mule_mode: muleConfig.inputType,
        sap_mode: sapConfig.inputType,
      });

      matchCounter.inc({
        result: result.isExactMatch ? "exact_match" : "discrepancy",
      });

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      logger.error(
        { err: error },
        "An error occurred while comparing endpoints",
      );

      comparisonCounter.inc({
        status: "error",
        mule_mode: "unknown",
        sap_mode: "unknown",
      });

      res.status(500).json({
        status: "error",
        message: "An error occurred while comparing endpoints.",
      });
    }
  }
}

export const comparatorController = new ComparatorController();
