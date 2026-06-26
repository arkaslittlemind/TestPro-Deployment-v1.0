import { useEffect, useState } from "react";

const detectPayloadFormat = (
  text: string,
): "XML" | "JSON" | "Unknown" | null => {
  if (!text || text.trim() === "") return null;

  const trimmed = text.trim();
  if (trimmed.startsWith("<")) return "XML";

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return "JSON";
    } catch {
      return "Unknown";
    }
  }

  return "Unknown";
};

interface BodyEditorProps {
  value?: string;
  onChange: (body: string | undefined) => void;
}

export function BodyEditor({ value = "", onChange }: BodyEditorProps) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const detectedFormat = detectPayloadFormat(text);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setText(newValue);
    const format = detectPayloadFormat(newValue);
    if (format === "JSON" || format === "XML") {
      onChange(newValue.trim());
    } else {
      onChange(undefined);
    }
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3 animate-fade-in">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Payload Body
          </label>
          {detectedFormat === "JSON" && (
            <span className="bg-green-100 text-green-800 border border-green-200 px-1.5 py-0.5 rounded-sm text-[10px] font-bold">
              JSON
            </span>
          )}
          {detectedFormat === "XML" && (
            <span className="bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded-sm text-[10px] font-bold">
              XML
            </span>
          )}
        </div>
        {detectedFormat === "Unknown" && (
          <span className="text-xs text-red-500 font-medium">
            Invalid Format
          </span>
        )}
      </div>
      <textarea
        className={`w-full h-32 border p-3 text-xs font-mono focus:outline-none transition-colors resize-y ${
          detectedFormat === "Unknown"
            ? "border-red-300 focus:border-red-500 bg-red-50"
            : "border-gray-300 focus:border-black bg-gray-50"
        }`}
        placeholder="Paste JSON {...} or XML <...>"
        value={text}
        onChange={handleTextChange}
        spellCheck="false"
      />
    </div>
  );
}
