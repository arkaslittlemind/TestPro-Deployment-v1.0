import type { EndpointLoadStats, LoadTestResult } from "../types";
import { PayloadDiffViewer } from "./PayloadDiffViewer";

interface LoadTestResultsProps {
  result: LoadTestResult;
  viewMode: "JSON" | "XML";
  onViewModeChange: (mode: "JSON" | "XML") => void;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "green" | "red" | "default";
}) {
  const valueClass =
    accent === "green"
      ? "text-emerald-700"
      : accent === "red"
        ? "text-jjred"
        : "text-gray-900";

  return (
    <div className="rounded-md border border-white/80 bg-white/65 px-4 py-3 shadow-sm shadow-gray-200/40 backdrop-blur-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function EndpointStats({
  title,
  description,
  stats,
  accent,
}: {
  title: string;
  description: string;
  stats: EndpointLoadStats;
  accent: "red" | "gray";
}) {
  const statusEntries = Object.entries(stats.statusCodes).sort(
    ([a], [b]) => Number(a) - Number(b),
  );

  const titleBorder = accent === "red" ? "border-jjred" : "border-gray-400";
  const titlePill =
    accent === "red"
      ? "bg-red-50/80 text-jjred ring-red-100"
      : "bg-gray-100/80 text-gray-700 ring-gray-200";

  return (
    <div className="overflow-hidden rounded-lg border border-white/80 bg-white/55 shadow-sm shadow-gray-200/50 backdrop-blur-md">
      <div className="border-b border-gray-200/70 bg-white/35 px-5 py-4">
        <div
          className={`inline-flex items-center gap-2 rounded px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ring-1 ring-inset ${titlePill}`}
        >
          {title}
        </div>
        <p className="mt-3 text-sm text-gray-600">{description}</p>
      </div>

      <div className={`border-t-2 ${titleBorder} px-5 py-5`}>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Success" value={stats.success} accent="green" />
          <StatCard label="Failed" value={stats.failed} accent="red" />
          <StatCard label="Min latency" value={`${stats.minLatencyMs} ms`} />
          <StatCard label="Avg latency" value={`${stats.avgLatencyMs} ms`} />
          <StatCard label="Max latency" value={`${stats.maxLatencyMs} ms`} />
          <StatCard label="Total requests" value={stats.total} />
        </div>

        {statusEntries.length > 0 && (
          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Status codes
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {statusEntries.map(([code, count]) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 rounded bg-gray-100/80 px-2.5 py-1 text-xs font-medium text-gray-700"
                >
                  {code}
                  <span className="text-gray-400">&times;</span>
                  {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-white/80 bg-white/60 px-4 py-4 shadow-sm shadow-gray-200/30 backdrop-blur-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{detail}</p>
    </div>
  );
}

export function LoadTestResults({
  result,
  viewMode,
  onViewModeChange,
}: LoadTestResultsProps) {
  const totalSuccess = result.mulesoft.success + result.sapBtp.success;
  const totalFailed = result.mulesoft.failed + result.sapBtp.failed;
  const totalRequests = result.concurrency * 2;
  const durationSeconds = Math.max(result.durationMs / 1000, 0.001);
  const requestsPerSecond = totalRequests / durationSeconds;
  const successRate =
    totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-white/80 bg-white/65 shadow-lg shadow-gray-200/50 backdrop-blur-xl animate-fade-in">
      <div className="border-b border-white/80 bg-gradient-to-br from-white/90 via-gray-50/80 to-red-50/45 px-6 py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-jjred">
              Performance benchmark
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              Load test completed
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Both endpoints were exercised under the same concurrent load so
              you can compare stability, latency, and response health side by
              side.
            </p>
          </div>

          {result.sampleComparison && (
            <div className="flex items-center gap-3">
              <span className="rounded border border-red-100 bg-red-50/70 px-3 py-1 text-xs font-medium text-jjred">
                Sample payload captured
              </span>
              <div className="flex rounded-md border border-gray-200/80 bg-white/65 p-1 shadow-sm shadow-gray-200/30">
                <button
                  onClick={() => onViewModeChange("JSON")}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === "JSON" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                >
                  JSON
                </button>
                <button
                  onClick={() => onViewModeChange("XML")}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === "XML" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                >
                  XML
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric
            label="Concurrency"
            value={formatNumber(result.concurrency)}
            detail="Requests sent to each endpoint"
          />
          <SummaryMetric
            label="Duration"
            value={`${formatNumber(result.durationMs)} ms`}
            detail="End-to-end execution time"
          />
          <SummaryMetric
            label="Success rate"
            value={formatPercent(successRate)}
            detail={`${formatNumber(totalSuccess)} succeeded / ${formatNumber(totalFailed)} failed`}
          />
          <SummaryMetric
            label="Throughput"
            value={`${requestsPerSecond.toFixed(1)} req/s`}
            detail={`${formatNumber(totalRequests)} total requests observed`}
          />
        </div>
      </div>

      <div className="bg-gray-50/45 px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <EndpointStats
            title="MuleSoft"
            description="Legacy API performance under the same request pressure."
            stats={result.mulesoft}
            accent="gray"
          />
          <EndpointStats
            title="SAP BTP"
            description="Target API behaviour and responsiveness during the run."
            stats={result.sapBtp}
            accent="red"
          />
        </div>

        {result.sampleComparison ? (
          <div className="mt-6 overflow-hidden rounded-lg border border-white/80 bg-white/55 shadow-sm shadow-gray-200/40 backdrop-blur-md">
            <div className="border-b border-gray-200/70 bg-white/35 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-jjred">
                Evidence snapshot
              </p>
              <h4 className="mt-2 text-base font-semibold text-gray-900">
                Sample response comparison
              </h4>
              <p className="mt-1 text-sm text-gray-600">
                The first successful pair captured during the run is preserved
                here for quick inspection.
              </p>
            </div>
            <div className="p-5">
              <PayloadDiffViewer
                result={result.sampleComparison}
                viewMode={viewMode}
              />
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-white/80 bg-white/55 px-5 py-6 text-center text-sm text-gray-500 shadow-sm shadow-gray-200/40 backdrop-blur-md">
            No successful response pair was available for payload comparison.
          </div>
        )}
      </div>
    </div>
  );
}
