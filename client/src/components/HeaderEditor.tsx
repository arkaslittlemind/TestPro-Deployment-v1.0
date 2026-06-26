import { useState, useEffect } from "react";

interface HeaderPair {
  key: string;
  value: string;
}

interface HeaderEditorProps {
  onChange: (headers: Record<string, string>) => void;
}

export function HeaderEditor({ onChange }: HeaderEditorProps) {
  const [headers, setHeaders] = useState<HeaderPair[]>([
    { key: "", value: "" },
  ]);

  // Convert array of pairs into a standard JavaScript object whenever it changes
  useEffect(() => {
    const headerObject: Record<string, string> = {};
    headers.forEach(({ key, value }) => {
      if (key.trim() !== "") {
        headerObject[key.trim()] = value.trim();
      }
    });
    onChange(headerObject);
  }, [headers, onChange]);

  const updateHeader = (
    index: number,
    field: "key" | "value",
    newValue: string,
  ) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = newValue;
    setHeaders(newHeaders);
  };

  const addRow = () => setHeaders([...headers, { key: "", value: "" }]);

  const removeRow = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    setHeaders(newHeaders.length ? newHeaders : [{ key: "", value: "" }]);
  };

  return (
    <div className="space-y-2 mt-3 border-t border-gray-100 pt-3">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Headers
        </label>
        <button
          onClick={addRow}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add Header
        </button>
      </div>

      {headers.map((header, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            placeholder="Key (e.g., Authorization)"
            className="w-1/3 border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-black"
            value={header.key}
            onChange={(e) => updateHeader(index, "key", e.target.value)}
          />
          <input
            type="text"
            placeholder="Value (e.g., Bearer token...)"
            className="flex-1 border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-black"
            value={header.value}
            onChange={(e) => updateHeader(index, "value", e.target.value)}
          />
          <button
            onClick={() => removeRow(index)}
            className="text-gray-400 hover:text-red-500 px-2"
            title="Remove Header"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
