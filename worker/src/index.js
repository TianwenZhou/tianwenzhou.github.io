function jsonResponse(data, origin, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...buildCorsHeaders(origin),
    },
  });
}

function buildCorsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function getAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowlist = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (allowlist.includes(origin)) {
    return origin;
  }

  return allowlist[0] || "*";
}

function buildDeepSeekMessages(messages, env) {
  const history = messages
    .slice(-8)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content || "").trim(),
    }))
    .filter((message) => message.content);

  if (env.SYSTEM_PROMPT) {
    return [{ role: "system", content: env.SYSTEM_PROMPT }, ...history];
  }

  return history;
}

function getLatestUserMessage(messages) {
  return [...messages]
    .reverse()
    .find((message) => message?.role !== "assistant" && String(message?.content || "").trim())
    ?.content
    ?.trim?.() ?? "";
}

function shouldUseWebSearch(query, env) {
  if (String(env.WEB_SEARCH_ENABLED || "true").toLowerCase() === "false") {
    return false;
  }

  return Boolean(query);
}

function shouldFetchWeather(query) {
  return /weather|forecast|temperature|rain|snow|wind|天气|气温|下雨|降雨|下雪|风速|预报/i.test(String(query || ""));
}

function trimSearchContext(value, maxLength = 5200) {
  const text = String(value || "").replace(/\s+\n/g, "\n").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}\n...` : text;
}

function normalizeSearchQuery(query) {
  return String(query || "")
    .replace(/请|帮我|麻烦|联网|上网|搜索|搜一下|查一下|查查|看看|最新|有哪些|是什么|怎么样|告诉我/gi, " ")
    .replace(/[？?。！，!,，;；:：]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || String(query || "").trim();
}

function decodeXml(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripHtml(value) {
  return decodeXml(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickXmlTag(block, tagName) {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return decodeXml(block.match(pattern)?.[1] || "").trim();
}

function parseSearchRss(xml, resultCount) {
  const items = [...String(xml || "").matchAll(/<item\b[\s\S]*?<\/item>/gi)]
    .slice(0, resultCount)
    .map((match) => {
      const block = match[0];
      return {
        title: stripHtml(pickXmlTag(block, "title")),
        link: stripHtml(pickXmlTag(block, "link")),
        snippet: stripHtml(pickXmlTag(block, "description")),
        date: stripHtml(pickXmlTag(block, "pubDate")),
      };
    })
    .filter((item) => item.title && item.link);

  return items.map((item, index) => {
    const lines = [`${index + 1}. ${item.title}`, `URL: ${item.link}`];
    if (item.date) {
      lines.push(`Date: ${item.date}`);
    }
    if (item.snippet) {
      lines.push(`Snippet: ${item.snippet}`);
    }
    return lines.join("\n");
  });
}

async function fetchWebSearchContext(query, env) {
  const resultCount = Math.max(1, Math.min(8, Number(env.WEB_SEARCH_RESULTS || 4)));
  const normalizedQuery = normalizeSearchQuery(query);
  const searchUrl = new URL("https://www.bing.com/search");
  searchUrl.searchParams.set("format", "rss");
  searchUrl.searchParams.set("mkt", "zh-CN");
  searchUrl.searchParams.set("q", normalizedQuery);
  const response = await fetch(searchUrl.toString(), {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
      "User-Agent": "ZhoutianwenAgentChat/1.0",
    },
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) {
    throw new Error(`Web search failed: ${response.status}`);
  }

  const results = parseSearchRss(await response.text(), resultCount);
  if (!results.length) {
    return "";
  }

  return [
    "Web search is enabled. Use the following fresh search results when they are relevant.",
    "Answer in Simplified Chinese by default. Cite useful source URLs from the search results when using them.",
    `Original query: ${query}`,
    `Search query: ${normalizedQuery}`,
    `Search time: ${new Date().toISOString()}`,
    trimSearchContext(results.join("\n\n")),
  ].join("\n\n");
}

function getWeatherLabel(code) {
  const labels = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
  };
  return labels[code] || "Unknown";
}

async function fetchWeatherContext(env) {
  const latitude = env.WEATHER_LATITUDE || "39.97";
  const longitude = env.WEATHER_LONGITUDE || "116.31";
  const location = env.WEATHER_LOCATION || "Beijing Haidian District";
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("timezone", "Asia/Shanghai");
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("forecast_days", "3");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) {
    throw new Error(`Weather fetch failed: ${response.status}`);
  }

  const data = await response.json();
  const current = data.current || {};
  const daily = data.daily || {};
  const forecast = (daily.time || []).map((date, index) => {
    const code = daily.weather_code?.[index];
    return [
      `${date}: ${getWeatherLabel(code)}`,
      `high ${daily.temperature_2m_max?.[index]}C`,
      `low ${daily.temperature_2m_min?.[index]}C`,
      `rain probability ${daily.precipitation_probability_max?.[index]}%`,
    ].join(", ");
  });

  return [
    "Fresh weather data from Open-Meteo. Use it when the user asks about weather.",
    `Location: ${location}`,
    `Updated at: ${current.time || new Date().toISOString()} Asia/Shanghai`,
    `Current: ${current.temperature_2m}C, ${getWeatherLabel(current.weather_code)}, humidity ${current.relative_humidity_2m}%, wind ${current.wind_speed_10m} km/h`,
    `Forecast: ${forecast.join(" | ")}`,
  ].join("\n");
}

function addWebSearchContext(messages, context) {
  if (!context) {
    return messages;
  }

  const [first, ...rest] = messages;
  const contextMessage = { role: "system", content: context };
  if (first?.role === "system") {
    return [first, contextMessage, ...rest];
  }

  return [contextMessage, ...messages];
}

function extractResponseText(payload) {
  return payload?.choices?.[0]?.message?.content?.trim?.() ?? "";
}

function buildDeepSeekRequestBody(messages, env) {
  const model = env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const body = {
    model,
    messages,
    stream: false,
    max_tokens: Number(env.MAX_OUTPUT_TOKENS || 220),
  };

  if (String(env.DEEPSEEK_THINKING || "").trim()) {
    body.thinking = { type: String(env.DEEPSEEK_THINKING).trim() };
  }

  return body;
}

async function handleChat(request, env) {
  if (!env.DEEPSEEK_API_KEY) {
    return jsonResponse({ error: "DEEPSEEK_API_KEY is not configured." }, getAllowedOrigin(request, env), 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, getAllowedOrigin(request, env), 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const latestUserMessage = getLatestUserMessage(messages);
  let deepSeekMessages = buildDeepSeekMessages(messages, env);
  if (!deepSeekMessages.length) {
    return jsonResponse({ error: "No chat messages provided." }, getAllowedOrigin(request, env), 400);
  }

  let webSearchUsed = false;
  const extraContexts = [];
  if (shouldFetchWeather(latestUserMessage)) {
    try {
      extraContexts.push(await fetchWeatherContext(env));
    } catch (error) {
      extraContexts.push(
        `Weather data was requested but failed: ${error instanceof Error ? error.message : String(error)}.`,
      );
    }
  }

  if (shouldUseWebSearch(latestUserMessage, env)) {
    try {
      const context = await fetchWebSearchContext(latestUserMessage, env);
      extraContexts.push(context);
      webSearchUsed = Boolean(context);
    } catch (error) {
      extraContexts.push(
        `Web search was attempted but failed: ${error instanceof Error ? error.message : String(error)}. Answer from existing knowledge and say if the answer may not be current.`,
      );
    }
  }
  deepSeekMessages = addWebSearchContext(deepSeekMessages, extraContexts.filter(Boolean).join("\n\n"));

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(buildDeepSeekRequestBody(deepSeekMessages, env)),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return jsonResponse(
      { error: `DeepSeek request failed: ${errorText}` },
      getAllowedOrigin(request, env),
      response.status,
    );
  }

  const payload = await response.json();
  const reply = extractResponseText(payload);
  if (!reply) {
    return jsonResponse({ error: "DeepSeek returned an empty reply." }, getAllowedOrigin(request, env), 502);
  }

  return jsonResponse(
    {
      reply,
      assistantName: "Agent Chat",
      model: env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      webSearchUsed,
    },
    getAllowedOrigin(request, env),
  );
}

export default {
  async fetch(request, env) {
    const origin = getAllowedOrigin(request, env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(origin),
      });
    }

    if (url.pathname === "/health") {
      return jsonResponse({ ok: true }, origin);
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }

    return jsonResponse({ error: "Not found." }, origin, 404);
  },
};
