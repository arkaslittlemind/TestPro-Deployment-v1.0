import axios, { AxiosRequestConfig } from "axios";
import { performance } from "node:perf_hooks";
import { XMLParser } from "fast-xml-parser";
import {
  ApiRequestConfig,
  ComparisonResult,
  ApiResponseMetrics,
  PayloadDifference,
} from "../types/comparator.types";
import { generatePayloadDiff } from "../utils/diffGenerator";

export class ComparatorService {
  /**
   * Orchestrates the concurrent fetching of both APIs.
   */
  public async compareEndpoints(
    muleConfig: ApiRequestConfig,
    sapConfig: ApiRequestConfig,
  ): Promise<ComparisonResult> {
    // FIX 1: Use processEndpoint instead of fetchWithMetrics so it respects the Raw/HTTP toggle
    const [muleResult, sapResult] = await Promise.allSettled([
      this.processEndpoint(muleConfig),
      this.processEndpoint(sapConfig),
    ]);

    const mulesoft =
      muleResult.status === "fulfilled"
        ? muleResult.value
        : this.formatCatastrophicError(muleResult.reason);
    const sapBtp =
      sapResult.status === "fulfilled"
        ? sapResult.value
        : this.formatCatastrophicError(sapResult.reason);

    // Generate the structural diff if both APIs returned data successfully
    let differences: PayloadDifference[] = [];
    if (mulesoft.data && sapBtp.data) {
      differences = generatePayloadDiff(mulesoft.data, sapBtp.data);
    }

    if (
      mulesoft.status !== null &&
      sapBtp.status !== null &&
      mulesoft.status !== sapBtp.status
    ) {
      // Push a custom difference object to flag the status code mismatch
      differences.push({
        path: "HTTP_STATUS_CODE", // A clear identifier for your UI
        muleValue: mulesoft.status,
        sapValue: sapBtp.status,
        // Depending on your PayloadDifference type, you might need to adjust these keys slightly
        type: "STATUS_MISMATCH",
      } as any);
    }

    return {
      mulesoft,
      sapBtp,
      differences,
      isExactMatch: differences.length === 0,
    };
  }

  /**
   * FIX 2: Safely parses raw strings (JSON or XML) into structured objects.
   * Prevents the diff engine from freezing on massive strings.
   */
  private parsePayload(rawData: any): any {
    // console.log("🚨🚨🚨 parsePayload IS ACTUALLY RUNNING! 🚨🚨🚨");
    if (typeof rawData !== "string") return rawData;

    let trimmed = rawData.trim();

    // ULTIMATE FIX: Strip ALL XML processing instructions BEFORE parsing.
    // This removes <?xml ... ?> and <?xml-stylesheet ... ?> completely.
    trimmed = trimmed.replace(/<\?[\s\S]*?\?>/g, "").trim();

    // 1. Try to parse as JSON
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        /* Ignore and fall through */
      }
    }

    // 2. Try to parse as XML
    if (trimmed.startsWith("<")) {
      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "!",
          parseAttributeValue: true,
          // We no longer rely on ignoreDeclaration because our regex handled it!
        });
        return parser.parse(trimmed);
      } catch (e) {
        /* Ignore and fall through */
      }
    }

    // 3. Fallback: If it's just plain text, wrap it in an object!
    return { raw_text_content: trimmed };
  }

  /**
   * Routes the configuration to either a network request or raw payload parsing.
   */
  private async processEndpoint(
    config: ApiRequestConfig,
  ): Promise<ApiResponseMetrics> {
    if (config.inputType === "raw") {
      const rawString = config.rawPayload || "";

      return {
        latencyMs: 0, // Instantaneous
        status: 200, // Spoof a 200 OK so the frontend renders it cleanly
        data: this.parsePayload(rawString), // Apply the parser
        error: null,
      };
    }

    // Fall back to the standard network request
    return this.fetchWithMetrics(config);
  }

  /**
   * Executes a single HTTP request and measures its exact latency.
   */
  public async fetchWithMetrics(
    config: ApiRequestConfig,
  ): Promise<ApiResponseMetrics> {
    // Set a strict 10-second default timeout
    const timeout = config.timeoutMs || 10000;

    const axiosConfig: AxiosRequestConfig = {
      url: config.url,
      method: config.method || "GET",
      headers: config.headers,
      data: config.body,
      timeout: timeout, // Enforce the timeout here
      validateStatus: () => true,
    };

    const start = performance.now();

    try {
      const response = await axios(axiosConfig);
      const end = performance.now();

      return {
        latencyMs: Number((end - start).toFixed(2)),
        status: response.status,
        data: this.parsePayload(response.data), // Apply the parser to HTTP responses too
        error: null,
      };
    } catch (error: any) {
      const end = performance.now();
      let errorMessage = error.message || "Unknown network error occurred";

      // Specifically catch and format Axios timeout errors
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        errorMessage = `Request timed out after ${timeout}ms. The server did not respond in time.`;
      }

      return {
        latencyMs: Number((end - start).toFixed(2)),
        status: null, // Status remains null because no HTTP response was received
        data: null,
        error: errorMessage,
      };
    }
  }

  /**
   * Fallback formatter if the promise itself rejects unexpectedly.
   */
  private formatCatastrophicError(error: any): ApiResponseMetrics {
    return {
      latencyMs: 0,
      status: null,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Export a singleton instance for simplicity
export const comparatorService = new ComparatorService();
