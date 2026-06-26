import client from "prom-client";

// 1. Enable default Node.js metrics (CPU, RAM, Event Loop lag)
client.collectDefaultMetrics();

// 2. Custom Counter: Track total API requests and where they came from
export const comparisonCounter = new client.Counter({
  name: "testpro_comparisons_total",
  help: "Total number of MuleSoft vs SAP BTP comparisons requested",
  labelNames: ["status", "mule_mode", "sap_mode"],
});

// 3. Custom Counter: Track the actual business logic (Match vs Discrepancy)
export const matchCounter = new client.Counter({
  name: "testpro_match_results_total",
  help: "Total number of exact matches versus discrepancies found",
  labelNames: ["result"], // Will be 'exact_match' or 'discrepancy'
});

// 4. Custom Counter: Track bulk load test runs
export const loadTestCounter = new client.Counter({
  name: "testpro_load_tests_total",
  help: "Total number of bulk load test runs",
  labelNames: ["concurrency", "status"],
});

// Export the registry so we can expose it in our Express app
export const metricsRegistry = client.register;
