/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import {
  LOAD_TEST_CONCURRENCY_OPTIONS,
  type ApiRequestConfig,
  type ComparisonResult,
  type LoadTestResult,
} from "./types";
import { PayloadDiffViewer } from "./components/PayloadDiffViewer";
import { LoadTestResults } from "./components/LoadTestResults";
import { HeaderEditor } from "./components/HeaderEditor";
import { BodyEditor } from "./components/BodyEditor";
import { ExportButtons } from "./components/ExportButtons";
import { Loader } from "./components/Loader";
import { applyAuthToConfig } from "./utils/authUtils";
import { AuthEditor } from "./components/AuthEditor";
import { Footer } from "./components/Footer";

const methodSupportsBody = (method: string) =>
  ["POST", "PUT", "PATCH"].includes(method);

// Interface for our Saved Presets
interface SavedPreset {
  id: string;
  name: string;
  region: string;
  mule: ApiRequestConfig;
  sap: ApiRequestConfig;
}

const REGIONS = ["GLOBAL", "NA", "EMEA", "ASPAC", "LATAM"];

const toastMessage = (title: string, description?: string) => (
  <div className="space-y-1">
    <p className="font-semibold">{title}</p>
    {description ? <p className="text-sm opacity-90">{description}</p> : null}
  </div>
);

function App() {
  const [muleConfig, setMuleConfig] = useState<ApiRequestConfig>({
    url: "",
    method: "GET",
    inputType: "http",
    rawPayload: "",
  });
  const [sapConfig, setSapConfig] = useState<ApiRequestConfig>({
    url: "",
    method: "GET",
    inputType: "http",
    rawPayload: "",
  });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"JSON" | "XML">("JSON");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loadTestConcurrency, setLoadTestConcurrency] = useState(10);
  const [loadTestResult, setLoadTestResult] = useState<LoadTestResult | null>(
    null,
  );

  const isHttpMode =
    muleConfig.inputType !== "raw" && sapConfig.inputType !== "raw";

  // State for Saved Presets
  const [presets, setPresets] = useState<SavedPreset[]>([]);

  const [activePresetId, setActivePresetId] = useState<string>("");

  const [activeRegion, setActiveRegion] = useState<string>("GLOBAL");

  const handleMuleHeaderChange = useCallback(
    (headers: Record<string, string>) => {
      setMuleConfig((prev) => ({ ...prev, headers }));
    },
    [],
  );

  const handleMuleBodyChange = useCallback((body: any) => {
    setMuleConfig((prev) => ({ ...prev, body }));
  }, []);

  const handleSapHeaderChange = useCallback(
    (headers: Record<string, string>) => {
      setSapConfig((prev) => ({ ...prev, headers }));
    },
    [],
  );

  const handleSapBodyChange = useCallback((body: any) => {
    setSapConfig((prev) => ({ ...prev, body }));
  }, []);

  // Load presets from Local Storage on initial render
  useEffect(() => {
    const saved = localStorage.getItem("testpro_presets");
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  }, []);

  const handleSavePreset = () => {
    const hasData =
      muleConfig.url ||
      sapConfig.url ||
      muleConfig.rawPayload ||
      sapConfig.rawPayload;
    if (!hasData) {
      toast.error(
        toastMessage("Nothing to save", "Please enter at least one URL."),
      );
      return;
    }

    const name = window.prompt(
      "Enter a name for this preset (e.g., ASPAC - Order Lookup):",
    );
    if (!name) return;

    const newId = Date.now().toString();

    const newPreset: SavedPreset = {
      id: newId,
      name,
      region: activeRegion,
      mule: muleConfig,
      sap: sapConfig,
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem("testpro_presets", JSON.stringify(updatedPresets));
    toast.success(
      toastMessage("Preset Saved", `"${name}" (${activeRegion}) is now saved.`),
    );
  };

  const handleLoadPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;

    setActivePresetId(id);

    const preset = presets.find((p) => p.id === id);
    if (preset) {
      setMuleConfig(preset.mule);
      setSapConfig(preset.sap);
      setActiveRegion(preset.region || "GLOBAL");
      toast(
        toastMessage(
          "Preset Loaded",
          `Loaded configuration for "${preset.name}".`,
        ),
        {
          icon: "i",
        },
      );
    }
    e.target.value = "";
  };

  const handleClearPresets = () => {
    if (
      window.confirm(
        "Are you sure you want to delete all saved configurations?",
      )
    ) {
      setPresets([]);
      localStorage.removeItem("testpro_presets");
      toast.success(
        toastMessage(
          "Presets Cleared",
          "All saved configurations have been removed.",
        ),
      );
    }
  };

  const handleCompare = async () => {
    // 1. Smart Validation: Check requirements based on the active inputType
    const isMuleValid =
      muleConfig.inputType === "raw"
        ? !!muleConfig.rawPayload?.trim()
        : !!muleConfig.url?.trim();

    const isSapValid =
      sapConfig.inputType === "raw"
        ? !!sapConfig.rawPayload?.trim()
        : !!sapConfig.url?.trim();

    if (!isMuleValid || !isSapValid) {
      toast.error(
        toastMessage(
          "Missing Information",
          "Please ensure URLs are provided for HTTP requests, and data is pasted for Raw Payloads.",
        ),
      );
      return;
    }

    setLoading(true);
    setResult(null);
    setLoadTestResult(null);

    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    const finalMuleConfig = applyAuthToConfig(muleConfig);
    const finalSapConfig = applyAuthToConfig(sapConfig);

    try {
      await toast.promise(
        axios.post(`${baseUrl}/api/v1/compare`, {
          muleConfig: finalMuleConfig,
          sapConfig: finalSapConfig,
        }),
        {
          loading: toastMessage(
            "Running Analysis",
            "Comparing MuleSoft and SAP payloads...",
          ),
          success: (response) => {
            const comparison = response.data.data as ComparisonResult;
            setResult(comparison);

            return comparison.isExactMatch
              ? toastMessage("Comparison Complete", "Endpoints match exactly.")
              : toastMessage(
                  "Comparison Complete",
                  `${comparison.differences.length} discrepancies found.`,
                );
          },
          error: (err: any) =>
            toastMessage(
              "Connection Failed",
              err.response?.data?.message ||
                "Could not reach the TestPro backend.",
            ),
        },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTest = async () => {
    if (!muleConfig.url?.trim() || !sapConfig.url?.trim()) {
      toast.error(
        toastMessage(
          "Missing Information",
          "Please provide URLs for both endpoints before running a performance test.",
        ),
      );
      return;
    }

    setLoading(true);
    setResult(null);
    setLoadTestResult(null);

    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    const finalMuleConfig = applyAuthToConfig(muleConfig);
    const finalSapConfig = applyAuthToConfig(sapConfig);

    try {
      await toast.promise(
        axios.post(`${baseUrl}/api/v1/load-test`, {
          muleConfig: finalMuleConfig,
          sapConfig: finalSapConfig,
          concurrency: loadTestConcurrency,
        }),
        {
          loading: toastMessage(
            "Running Performance Test",
            `Sending ${loadTestConcurrency} concurrent requests per endpoint...`,
          ),
          success: (response) => {
            const loadResult = response.data.data as LoadTestResult;
            setLoadTestResult(loadResult);

            const totalSuccess =
              loadResult.mulesoft.success + loadResult.sapBtp.success;
            const totalFailed =
              loadResult.mulesoft.failed + loadResult.sapBtp.failed;

            return toastMessage(
              "Performance Test Complete",
              `${totalSuccess} succeeded, ${totalFailed} failed in ${loadResult.durationMs} ms.`,
            );
          },
          error: (err: any) =>
            toastMessage(
              "Performance Test Failed",
              err.response?.data?.message ||
                "Could not reach the TestPro backend.",
            ),
        },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans selection:bg-jjred selection:text-white">
      <Toaster position="top-right" />

      {/* Hero Header */}
      <header className="bg-white border-b border-gray-100 pt-12 pb-8 mb-8">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center text-center">
          {/* <div className="bg-red-50 text-jjred text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
            Internal Tool
          </div> */}
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gray-900">
            Test<span className="text-jjred">Pro</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-lg">
            MuleSoft to SAP BTP Migration Validator
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-8 pb-16 flex-1">
        {/* Presets Bar */}
        <div className="flex justify-between items-center bg-gray-50 border border-gray-200 px-6 py-4 rounded-lg mb-8 shadow-sm">
          <div className="flex items-center gap-6">
            {/* New Region Selector */}
            <div className="flex items-center gap-2 border-r border-gray-300 pr-6">
              <span className="text-sm font-bold text-gray-800 tracking-wide">
                REGION:
              </span>
              <select
                className="border border-gray-300 text-sm font-
                 text-black px-3 py-1.5 rounded bg-white focus:outline-none focus:border-jjred focus:ring-1 focus:ring-jjred shadow-sm"
                value={activeRegion}
                onChange={(e) => setActiveRegion(e.target.value)}
              >
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* Existing Presets Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">
                Saved Configs:
              </span>
              <select
                className="border border-gray-300 text-sm px-3 py-1.5 rounded bg-white focus:outline-none focus:border-jjred min-w-50"
                onChange={handleLoadPreset}
                value={activePresetId}
              >
                <option value="" disabled>
                  -- Load a preset --
                </option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.region || "GLOBAL"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSavePreset}
              className="text-sm font-semibold text-jjred hover:text-red-700 transition-colors"
            >
              + Save Current Setup
            </button>
            {presets.length > 0 && (
              <button
                onClick={handleClearPresets}
                className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors border-l border-gray-300 pl-3"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Configuration Form */}
        <div className="grid grid-cols-2 gap-10 mb-10">
          {/* MuleSoft Configuration */}
          <div className="space-y-4 bg-white p-6 border border-gray-100 shadow-sm rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                MuleSoft
              </h2>

              {/* Switch UI Toggle */}
              <div className="flex items-center gap-3">
                <span
                  onClick={() =>
                    setMuleConfig((prev) => ({ ...prev, inputType: "http" }))
                  }
                  className={`text-xs font-bold cursor-pointer transition-colors ${muleConfig.inputType !== "raw" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                >
                  HTTP Request
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setMuleConfig((prev) => ({
                      ...prev,
                      inputType: prev.inputType === "raw" ? "http" : "raw",
                    }))
                  }
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${muleConfig.inputType === "raw" ? "bg-jjred" : "bg-gray-300"}`}
                  role="switch"
                  aria-checked={muleConfig.inputType === "raw"}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${muleConfig.inputType === "raw" ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>

                <span
                  onClick={() =>
                    setMuleConfig((prev) => ({ ...prev, inputType: "raw" }))
                  }
                  className={`text-xs font-bold cursor-pointer transition-colors ${muleConfig.inputType === "raw" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Raw Payload
                </span>
              </div>
            </div>

            {/* Conditional Input Rendering */}
            {muleConfig.inputType === "raw" ? (
              <div className="animate-fade-in pt-2">
                <BodyEditor
                  value={muleConfig.rawPayload}
                  onChange={(body) =>
                    setMuleConfig((prev) => ({
                      ...prev,
                      rawPayload: body || "",
                    }))
                  }
                />
              </div>
            ) : (
              <div className="animate-fade-in space-y-4 pt-2">
                <div className="flex gap-2">
                  <select
                    className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-jjred focus:ring-1 focus:ring-jjred bg-gray-50 rounded-md shadow-sm"
                    value={muleConfig.method}
                    onChange={(e) =>
                      setMuleConfig((prev) => ({
                        ...prev,
                        method: e.target.value,
                      }))
                    }
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <input
                    type="text"
                    placeholder="https://api.mulesoft.com/..."
                    className="flex-1 border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-jjred focus:ring-1 focus:ring-jjred rounded-md transition-all shadow-sm"
                    value={muleConfig.url}
                    onChange={(e) =>
                      setMuleConfig((prev) => ({
                        ...prev,
                        url: e.target.value,
                      }))
                    }
                  />
                </div>
                <AuthEditor
                  value={muleConfig.auth}
                  onChange={(auth) =>
                    setMuleConfig((prev) => ({ ...prev, auth }))
                  }
                />
                <HeaderEditor onChange={handleMuleHeaderChange} />
                {methodSupportsBody(muleConfig.method) && (
                  <BodyEditor onChange={handleMuleBodyChange} />
                )}
              </div>
            )}
          </div>

          {/* SAP BTP Configuration */}
          <div className="space-y-4 bg-white p-6 border border-gray-100 shadow-sm rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                SAP BTP
              </h2>

              {/* Switch UI Toggle */}
              <div className="flex items-center gap-3">
                <span
                  onClick={() =>
                    setSapConfig((prev) => ({ ...prev, inputType: "http" }))
                  }
                  className={`text-xs font-bold cursor-pointer transition-colors ${sapConfig.inputType !== "raw" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                >
                  HTTP Request
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setSapConfig((prev) => ({
                      ...prev,
                      inputType: prev.inputType === "raw" ? "http" : "raw",
                    }))
                  }
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${sapConfig.inputType === "raw" ? "bg-jjred" : "bg-gray-300"}`}
                  role="switch"
                  aria-checked={sapConfig.inputType === "raw"}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${sapConfig.inputType === "raw" ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>

                <span
                  onClick={() =>
                    setSapConfig((prev) => ({ ...prev, inputType: "raw" }))
                  }
                  className={`text-xs font-bold cursor-pointer transition-colors ${sapConfig.inputType === "raw" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Raw Payload
                </span>
              </div>
            </div>

            {/* Conditional Input Rendering */}
            {sapConfig.inputType === "raw" ? (
              <div className="animate-fade-in pt-2">
                <BodyEditor
                  value={sapConfig.rawPayload}
                  onChange={(body) =>
                    setSapConfig((prev) => ({
                      ...prev,
                      rawPayload: body || "",
                    }))
                  }
                />
              </div>
            ) : (
              <div className="animate-fade-in space-y-4 pt-2">
                <div className="flex gap-2">
                  <select
                    className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-jjred focus:ring-1 focus:ring-jjred bg-gray-50 rounded-md shadow-sm"
                    value={sapConfig.method}
                    onChange={(e) =>
                      setSapConfig((prev) => ({
                        ...prev,
                        method: e.target.value,
                      }))
                    }
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <input
                    type="text"
                    placeholder="https://api.sap.com/..."
                    className="flex-1 border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-jjred focus:ring-1 focus:ring-jjred rounded-md transition-all shadow-sm"
                    value={sapConfig.url}
                    onChange={(e) =>
                      setSapConfig((prev) => ({ ...prev, url: e.target.value }))
                    }
                  />
                </div>
                <AuthEditor
                  value={sapConfig.auth}
                  onChange={(auth) =>
                    setSapConfig((prev) => ({ ...prev, auth }))
                  }
                />
                <HeaderEditor onChange={handleSapHeaderChange} />
                {methodSupportsBody(sapConfig.method) && (
                  <BodyEditor onChange={handleSapBodyChange} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <button
            onClick={handleCompare}
            disabled={loading}
            className="flex items-center gap-2 bg-jjred text-white px-8 py-3 text-sm font-semibold rounded-full hover:bg-red-700 disabled:opacity-70 transition-all shadow-md hover:shadow-lg"
          >
            {loading ? <Loader /> : null}
            {loading ? "Analyzing Payloads..." : "Run Analysis"}
          </button>

          {isHttpMode && (
            <section className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-xl">
              <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.4fr,1fr] lg:items-center">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                    Load testing
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    Stress both endpoints with matched concurrent traffic
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    Use this performance pass to validate stability and latency
                    under production-style pressure before promoting a
                    migration.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                      HTTP-only workflow
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                      Side-by-side comparison
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Concurrent requests per endpoint
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {loadTestConcurrency}
                      </p>
                    </div>
                    <select
                      className="min-w-28 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white shadow-sm focus:outline-none focus:border-jjred focus:ring-1 focus:ring-jjred"
                      value={loadTestConcurrency}
                      onChange={(e) =>
                        setLoadTestConcurrency(Number(e.target.value))
                      }
                      disabled={loading}
                    >
                      {LOAD_TEST_CONCURRENCY_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Total requests
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {loadTestConcurrency * 2}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Coverage
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        2 endpoints
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleLoadTest}
                    disabled={loading}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-jjred px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/20 transition-all hover:bg-red-700 hover:shadow-xl disabled:opacity-70"
                  >
                    {loading ? <Loader /> : null}
                    {loading
                      ? "Running Performance Test..."
                      : "Run Performance Test"}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Results Section */}
        {loadTestResult && (
          <LoadTestResults
            result={loadTestResult}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        )}

        {result && !loadTestResult && (
          <div className="space-y-6 animate-fade-in border-t border-gray-100 pt-8">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 border-l-4 pl-4 border-jjred">
                <span className="text-sm font-bold text-gray-800">
                  Match Status:
                </span>
                <span
                  className={`text-sm font-medium ${result.isExactMatch ? "text-green-600" : "text-red-600"}`}
                >
                  {result.isExactMatch
                    ? "Exact Match Confirmed"
                    : `${result.differences.length} Discrepancies Detected`}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* NEW: View Mode Toggles */}
                <div className="flex bg-gray-200 p-1 rounded-md">
                  <button
                    onClick={() => setViewMode("JSON")}
                    className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${viewMode === "JSON" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setViewMode("XML")}
                    className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${viewMode === "XML" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    XML
                  </button>
                </div>

                {/* Export Buttons */}
                <ExportButtons result={result} region={activeRegion} />
              </div>
            </div>

            {/* Pass the new prop to the Viewer */}
            <PayloadDiffViewer result={result} viewMode={viewMode} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
