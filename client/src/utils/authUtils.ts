import type { ApiRequestConfig } from "../types";

/**
 * Evaluates the auth configuration and injects the appropriate Authorization header
 * into the config payload before it is sent to the TestPro backend.
 */
export const applyAuthToConfig = (
  config: ApiRequestConfig,
): ApiRequestConfig => {
  // Deep copy the config and headers so we do not mutate the React state directly
  const updatedConfig = {
    ...config,
    headers: { ...config.headers },
  };

  if (!config.auth) return updatedConfig;

  if (
    config.auth.type === "basic" &&
    config.auth.basic?.username &&
    config.auth.basic?.password
  ) {
    // btoa safely encodes the string to Base64 in the browser
    const encoded = btoa(
      `${config.auth.basic.username}:${config.auth.basic.password}`,
    );
    updatedConfig.headers["Authorization"] = `Basic ${encoded}`;
  } else if (config.auth.type === "bearer" && config.auth.bearer?.token) {
    updatedConfig.headers["Authorization"] =
      `Bearer ${config.auth.bearer.token}`;
  }

  return updatedConfig;
};
