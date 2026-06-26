import type { AuthConfig, AuthType } from "../types";

interface AuthEditorProps {
  value?: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

export function AuthEditor({ value, onChange }: AuthEditorProps) {
  const currentAuth: AuthConfig = value || { type: "none" };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as AuthType;
    const newAuth: AuthConfig = { ...currentAuth, type: newType };

    if (newType === "basic" && !newAuth.basic)
      newAuth.basic = { username: "", password: "" };
    if (newType === "bearer" && !newAuth.bearer) newAuth.bearer = { token: "" };

    onChange(newAuth);
  };

  const handleBasicChange = (field: "username" | "password", val: string) => {
    const newAuth: AuthConfig = {
      ...currentAuth,
      basic: { ...currentAuth.basic, [field]: val },
    };
    onChange(newAuth);
  };

  const handleBearerChange = (val: string) => {
    const newAuth: AuthConfig = {
      ...currentAuth,
      bearer: { ...currentAuth.bearer, token: val },
    };
    onChange(newAuth);
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Authentication
        </label>
      </div>

      <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
        {/* Auth Type Selector */}
        <div>
          <select
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-jjred focus:ring-1 focus:ring-jjred bg-white rounded-md shadow-sm"
            value={currentAuth.type}
            onChange={handleTypeChange}
          >
            <option value="none">No Auth</option>
            <option value="basic">Basic Auth</option>
            <option value="bearer">Bearer Token</option>
          </select>
        </div>

        {/* Dynamic Fields: Basic Auth */}
        {currentAuth.type === "basic" && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <input
              type="text"
              placeholder="Username"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-jjred focus:ring-1 focus:ring-jjred rounded-md"
              value={currentAuth.basic?.username || ""}
              onChange={(e) => handleBasicChange("username", e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-jjred focus:ring-1 focus:ring-jjred rounded-md"
              value={currentAuth.basic?.password || ""}
              onChange={(e) => handleBasicChange("password", e.target.value)}
            />
          </div>
        )}

        {/* Dynamic Fields: Bearer Token */}
        {currentAuth.type === "bearer" && (
          <div className="animate-fade-in">
            <input
              type="text"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-jjred focus:ring-1 focus:ring-jjred rounded-md font-mono"
              value={currentAuth.bearer?.token || ""}
              onChange={(e) => handleBearerChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
