import React, { useMemo } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { XMLBuilder } from "fast-xml-parser";
import type { ComparisonResult } from "../types";

interface PayloadDiffViewerProps {
  result: ComparisonResult;
  viewMode: "JSON" | "XML"; // <-- Add the new prop
}

export const PayloadDiffViewer = React.memo(function PayloadDiffViewer({
  result,
  viewMode,
}: PayloadDiffViewerProps) {
  // Initialize the XML builder using useMemo for performance
  const builder = useMemo(
    () =>
      new XMLBuilder({
        format: true, // Pretty-prints with indentation
        ignoreAttributes: false,
      }),
    [],
  );

  // Dynamically generate the MuleSoft payload string
  const oldCode = useMemo(() => {
    if (!result.mulesoft.data) return "";
    try {
      return viewMode === "XML"
        ? builder.build(result.mulesoft.data)
        : JSON.stringify(result.mulesoft.data, null, 2);
    } catch {
      return "Error generating view.";
    }
  }, [result.mulesoft.data, viewMode, builder]);

  // Dynamically generate the SAP BTP payload string
  const newCode = useMemo(() => {
    if (!result.sapBtp.data) return "";
    try {
      return viewMode === "XML"
        ? builder.build(result.sapBtp.data)
        : JSON.stringify(result.sapBtp.data, null, 2);
    } catch {
      return "Error generating view.";
    }
  }, [result.sapBtp.data, viewMode, builder]);

  const newStyles = {
    variables: {
      light: {
        diffViewerBackground: "#fff",
        diffViewerColor: "#111827",
        addedBackground: "#e6ffed",
        addedColor: "#24292e",
        removedBackground: "#ffeef0",
        removedColor: "#24292e",
        wordAddedBackground: "#acf2bd",
        wordRemovedBackground: "#fdb8c0",
        addedGutterBackground: "#cdffd8",
        removedGutterBackground: "#ffdce0",
        gutterBackground: "#f9fafb",
        gutterBackgroundDark: "#f3f4f6",
        highlightBackground: "#fffbdd",
        highlightGutterBackground: "#fff5b1",
        emptyLineBackground: "#fafbfc",
      },
    },
  };

  return (
    <div className="border border-gray-200 bg-white rounded-md overflow-hidden shadow-sm animate-fade-in mt-4">
      {/* Status Code Mismatch Alert (From our earlier fix!) */}
      {result.mulesoft.status !== null &&
        result.sapBtp.status !== null &&
        result.mulesoft.status !== result.sapBtp.status && (
          <div className="bg-red-50 border-b border-red-200 p-3">
            <div className="flex items-center">
              <span className="text-red-600 font-bold text-sm">
                ⚠️ HTTP Status Mismatch:
              </span>
              <span className="ml-2 text-sm text-red-800">
                MuleSoft returned <strong>{result.mulesoft.status}</strong>, but
                SAP BTP returned <strong>{result.sapBtp.status}</strong>.
              </span>
            </div>
          </div>
        )}

      <div className="flex justify-between items-center bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-sm text-gray-900">MuleSoft</span>
          <span className="text-xs text-gray-500">
            Status: {result.mulesoft.status || "Error"} | Latency:{" "}
            {result.mulesoft.latencyMs}ms
          </span>
        </div>

        {/* Dynamic Badge showing the current format */}
        <span className="px-3 py-1 bg-gray-200 text-gray-700 text-[10px] font-bold uppercase rounded-full tracking-wider">
          {viewMode} Diff
        </span>

        <div className="flex flex-col text-right">
          <span className="font-medium text-sm text-gray-900">SAP BTP</span>
          <span className="text-xs text-gray-500">
            Status: {result.sapBtp.status || "Error"} | Latency:{" "}
            {result.sapBtp.latencyMs}ms
          </span>
        </div>
      </div>

      <ReactDiffViewer
        oldValue={oldCode}
        newValue={newCode}
        splitView={true}
        compareMethod={DiffMethod.WORDS}
        styles={newStyles}
        leftTitle="MuleSoft Payload"
        rightTitle="SAP BTP Payload"
        useDarkTheme={false}
      />
    </div>
  );
});
