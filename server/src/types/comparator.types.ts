export type DifferenceType =
  | "missing_in_sap"
  | "missing_in_mule"
  | "type_mismatch"
  | "value_mismatch";

export interface PayloadDifference {
  path: string;
  type: DifferenceType;
  muleValue: any;
  sapValue: any;
}

export interface ApiRequestConfig {
  inputType?: "http" | "raw";
  rawPayload?: string;
  url: string;
  method?: "GET" | "POST" | "PUT";
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
}

export interface ApiResponseMetrics {
  latencyMs: number;
  status: number | null;
  data: any | null;
  error: string | null;
}

export interface ComparisonResult {
  mulesoft: ApiResponseMetrics;
  sapBtp: ApiResponseMetrics;
  differences: PayloadDifference[];
  isExactMatch: boolean;
}

export const LOAD_TEST_CONCURRENCY_OPTIONS = [
  5, 10, 50, 100, 150, 200,
] as const;

export type LoadTestConcurrency =
  (typeof LOAD_TEST_CONCURRENCY_OPTIONS)[number];

export interface EndpointLoadStats {
  total: number;
  success: number;
  failed: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  avgLatencyMs: number;
  statusCodes: Record<string, number>;
}

export interface LoadTestResult {
  concurrency: number;
  durationMs: number;
  mulesoft: EndpointLoadStats;
  sapBtp: EndpointLoadStats;
  sampleComparison: ComparisonResult | null;
}
