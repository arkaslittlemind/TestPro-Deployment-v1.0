import { performance } from "node:perf_hooks";
import {
  ApiRequestConfig,
  ApiResponseMetrics,
  ComparisonResult,
  EndpointLoadStats,
  LOAD_TEST_CONCURRENCY_OPTIONS,
  LoadTestConcurrency,
  LoadTestResult,
  PayloadDifference,
} from "../types/comparator.types";
import { comparatorService } from "./ComparatorService";
import { generatePayloadDiff } from "../utils/diffGenerator";

function isSuccessfulResponse(result: ApiResponseMetrics): boolean {
  return result.error === null && result.status !== null;
}

function aggregateStats(results: ApiResponseMetrics[]): EndpointLoadStats {
  const total = results.length;
  let success = 0;
  let failed = 0;
  const latencies: number[] = [];
  const statusCodes: Record<string, number> = {};

  for (const result of results) {
    if (isSuccessfulResponse(result)) {
      success++;
      latencies.push(result.latencyMs);
      statusCodes[String(result.status)] =
        (statusCodes[String(result.status)] || 0) + 1;
    } else {
      failed++;
    }
  }

  const minLatencyMs = latencies.length ? Math.min(...latencies) : 0;
  const maxLatencyMs = latencies.length ? Math.max(...latencies) : 0;
  const avgLatencyMs = latencies.length
    ? Number(
        (latencies.reduce((sum, value) => sum + value, 0) / latencies.length).toFixed(2),
      )
    : 0;

  return {
    total,
    success,
    failed,
    minLatencyMs,
    maxLatencyMs,
    avgLatencyMs,
    statusCodes,
  };
}

function buildSampleComparison(
  mulesoft: ApiResponseMetrics,
  sapBtp: ApiResponseMetrics,
): ComparisonResult {
  let differences: PayloadDifference[] = [];
  if (mulesoft.data && sapBtp.data) {
    differences = generatePayloadDiff(mulesoft.data, sapBtp.data);
  }

  if (
    mulesoft.status !== null &&
    sapBtp.status !== null &&
    mulesoft.status !== sapBtp.status
  ) {
    differences.push({
      path: "HTTP_STATUS_CODE",
      muleValue: mulesoft.status,
      sapValue: sapBtp.status,
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

export class LoadTestService {
  public async runLoadTest(
    muleConfig: ApiRequestConfig,
    sapConfig: ApiRequestConfig,
    concurrency: number,
  ): Promise<LoadTestResult> {
    if (
      !LOAD_TEST_CONCURRENCY_OPTIONS.includes(concurrency as LoadTestConcurrency)
    ) {
      throw new Error(
        `Invalid concurrency. Must be one of: ${LOAD_TEST_CONCURRENCY_OPTIONS.join(", ")}`,
      );
    }

    if (muleConfig.inputType === "raw" || sapConfig.inputType === "raw") {
      throw new Error(
        "Load testing is only available for HTTP Request mode on both endpoints.",
      );
    }

    let firstMuleSuccess: ApiResponseMetrics | null = null;
    let firstSapSuccess: ApiResponseMetrics | null = null;

    const trackFirstSuccess = (
      result: ApiResponseMetrics,
      side: "mule" | "sap",
    ) => {
      if (
        !isSuccessfulResponse(result) ||
        result.data === null ||
        result.data === undefined
      ) {
        return;
      }

      if (side === "mule" && !firstMuleSuccess) {
        firstMuleSuccess = result;
      } else if (side === "sap" && !firstSapSuccess) {
        firstSapSuccess = result;
      }
    };

    const mulePromises = Array.from({ length: concurrency }, () =>
      comparatorService.fetchWithMetrics(muleConfig).then((result) => {
        trackFirstSuccess(result, "mule");
        return result;
      }),
    );

    const sapPromises = Array.from({ length: concurrency }, () =>
      comparatorService.fetchWithMetrics(sapConfig).then((result) => {
        trackFirstSuccess(result, "sap");
        return result;
      }),
    );

    const start = performance.now();

    const [muleSettled, sapSettled] = await Promise.all([
      Promise.allSettled(mulePromises),
      Promise.allSettled(sapPromises),
    ]);

    const durationMs = Number((performance.now() - start).toFixed(2));

    const unwrapResults = (
      settled: PromiseSettledResult<ApiResponseMetrics>[],
    ): ApiResponseMetrics[] =>
      settled.map((entry) =>
        entry.status === "fulfilled"
          ? entry.value
          : {
              latencyMs: 0,
              status: null,
              data: null,
              error:
                entry.reason instanceof Error
                  ? entry.reason.message
                  : String(entry.reason),
            },
      );

    const muleResults = unwrapResults(muleSettled);
    const sapResults = unwrapResults(sapSettled);

    const sampleComparison =
      firstMuleSuccess && firstSapSuccess
        ? buildSampleComparison(firstMuleSuccess, firstSapSuccess)
        : null;

    return {
      concurrency,
      durationMs,
      mulesoft: aggregateStats(muleResults),
      sapBtp: aggregateStats(sapResults),
      sampleComparison,
    };
  }
}

export const loadTestService = new LoadTestService();
