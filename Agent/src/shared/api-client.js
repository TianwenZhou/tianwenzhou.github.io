const defaultAgentApiBaseUrl = "http://39.97.233.15";

function trimTrailingSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function getAgentApiBaseUrl() {
  const configured =
    trimTrailingSlash(window.AGENT_API_BASE_URL) ||
    trimTrailingSlash(window.AGENT_CONFIG?.apiBaseUrl) ||
    trimTrailingSlash(window.AGENT_WEATHER_CONFIG?.apiBaseUrl);

  return configured || defaultAgentApiBaseUrl;
}

export function buildAgentApiUrl(path, params = {}) {
  const base = getAgentApiBaseUrl();
  const normalizedPath = String(path || "").startsWith("/") ? String(path || "") : `/${path || ""}`;
  const url = new URL(`${base}${normalizedPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

export async function fetchAgentJson(path, options = {}) {
  const {
    method = "GET",
    params,
    body,
    timeoutMs = 10000,
    headers = {},
    cache = "no-store",
  } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildAgentApiUrl(path, params), {
      method,
      cache,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.detail || payload?.error || `HTTP ${response.status}`);
    }

    return payload;
  } finally {
    window.clearTimeout(timer);
  }
}
