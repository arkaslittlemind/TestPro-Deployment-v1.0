/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { ComparisonResult } from "../types";

interface ExportButtonsProps {
  result: ComparisonResult;
  region: string;
}

export function ExportButtons({ result, region }: ExportButtonsProps) {
  // --- NEW EXCEL EXPORT LOGIC ---
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TestPro Migration Validator";
    workbook.created = new Date();

    // --- TAB 1: Summary Sheet ---
    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 25 },
      { header: "Value", key: "value", width: 70 }, // Widened for better readability
    ];

    summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    summarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFC8102E" },
    };

    summarySheet.addRows([
      { metric: "Tool", value: "TestPro Migration Validator" },
      { metric: "Environment", value: "Johnson & Johnson Internal" },
      { metric: "Region", value: region },
      { metric: "Timestamp", value: new Date().toLocaleString() },
      {
        metric: "Match Status",
        value: result.isExactMatch ? "EXACT MATCH" : "DISCREPANCIES FOUND",
      },
      { metric: "Total Differences", value: result.differences.length },
      { metric: "MuleSoft Latency", value: `${result.mulesoft.latencyMs} ms` },
      { metric: "SAP BTP Latency", value: `${result.sapBtp.latencyMs} ms` },
    ]);

    const statusCell = summarySheet.getCell("B5");
    statusCell.font = {
      bold: true,
      color: { argb: result.isExactMatch ? "FF00B050" : "FFFF0000" },
    };

    // --- TAB 2: Discrepancies Sheet ---
    if (result.differences.length > 0) {
      const diffSheet = workbook.addWorksheet("Discrepancies");
      diffSheet.columns = [
        { header: "JSON / XML Path", key: "path", width: 50 },
        { header: "Issue Type", key: "type", width: 25 },
        { header: "Legacy MuleSoft Value", key: "mule", width: 50 },
        { header: "New SAP BTP Value", key: "sap", width: 50 },
      ];

      diffSheet.getRow(1).font = { bold: true };
      diffSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      };

      result.differences.forEach((diff: any) => {
        const safeStringify = (val: any) =>
          typeof val === "object" && val !== null
            ? JSON.stringify(val)
            : String(val ?? "MISSING");

        // Clean up the issue type text (e.g., "value_mismatch" -> "Value Mismatch")
        const formattedType = (diff.type || "MISMATCH")
          .replace("_", " ")
          .replace(/\b\w/g, (l: string) => l.toUpperCase());

        const row = diffSheet.addRow({
          path: diff.path || diff.key || "Unknown Path",
          type: formattedType,
          mule: safeStringify(diff.muleValue ?? diff.oldValue),
          sap: safeStringify(diff.sapValue ?? diff.newValue),
        });

        row.getCell("mule").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFE5E5" },
        };
        row.getCell("sap").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5FFE5" },
        };
        row.getCell("mule").alignment = { wrapText: true, vertical: "top" };
        row.getCell("sap").alignment = { wrapText: true, vertical: "top" };
      });
    }

    // --- TAB 3: Raw MuleSoft Payload (NEW) ---
    if (result.mulesoft.data) {
      const muleSheet = workbook.addWorksheet("Raw MuleSoft");
      muleSheet.getColumn(1).width = 120; // Make it wide enough to act as a code viewer
      const cell = muleSheet.getCell("A1");
      cell.value = JSON.stringify(result.mulesoft.data, null, 2);
      cell.alignment = { wrapText: true, vertical: "top" };
      cell.font = { name: "Courier New", size: 10 }; // Monospace font for code readability
    }

    // --- TAB 4: Raw SAP BTP Payload (NEW) ---
    if (result.sapBtp.data) {
      const sapSheet = workbook.addWorksheet("Raw SAP BTP");
      sapSheet.getColumn(1).width = 120;
      const cell = sapSheet.getCell("A1");
      cell.value = JSON.stringify(result.sapBtp.data, null, 2);
      cell.alignment = { wrapText: true, vertical: "top" };
      cell.font = { name: "Courier New", size: 10 };
    }

    // Trigger the file download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `TestPro_${region}_Report_${Date.now()}.xlsx`);
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleExportExcel}
        className="px-4 py-1.5 border border-jjred text-xs font-semibold uppercase tracking-wider text-jjred hover:bg-jjred hover:text-white transition-colors bg-white rounded shadow-sm"
        title="Download formatted Excel report"
      >
        Export to Excel
      </button>
    </div>
  );
}
