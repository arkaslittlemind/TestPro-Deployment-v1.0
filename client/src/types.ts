/* eslint-disable @typescript-eslint/no-explicit-any */

export type AuthType = "none" | "basic" | "bearer";

export interface AuthConfig {
  type: AuthType;
  basic?: {
    username?: string;
    password?: string;
  };
  bearer?: {
    token?: string;
  };
}

export interface ApiRequestConfig {
  rawPayload: string;
  inputType: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  auth?: AuthConfig;
}

export interface ApiResponseMetrics {
  latencyMs: number;
  status: number | null;
  data: any | null;
  error: string | null;
}

export interface PayloadDifference {
  path: string;
  type: string;
  muleValue: any;
  sapValue: any;
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
